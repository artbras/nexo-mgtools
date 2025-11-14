import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeQuery } from "./services/openai";
import { getDashboardKPIs } from "./services/supabase";
import { login, getUserById, createUser, type SessionUser } from "./services/auth";

// Middleware de autenticação
function requireAuth(req: any, res: any, next: any) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

// Middleware de autorização admin
function requireAdmin(req: any, res: any, next: any) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ===========================
  // AUTH ROUTES (PÚBLICAS)
  // ===========================
  
  // POST /api/auth/login - Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await login(email, password);

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Salvar na sessão e garantir que seja persistida
      (req.session as any).user = user;
      
      // CRÍTICO: Salvar sessão explicitamente antes de retornar resposta
      // Necessário para domínios customizados e ambientes de produção com proxies
      req.session.save((err) => {
        if (err) {
          console.error('[AUTH] Erro ao salvar sessão:', err);
          return res.status(500).json({ error: 'Erro ao salvar sessão' });
        }

        return res.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role,
          }
        });
      });

    } catch (error: any) {
      console.error('[AUTH] Erro no login:', error);
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  });

  // POST /api/auth/logout - Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao fazer logout' });
      }
      res.json({ success: true });
    });
  });

  // GET /api/auth/me - Dados do usuário logado
  app.get("/api/auth/me", async (req, res) => {
    // Debug: Verificar se há sessão
    if (!req.session) {
      console.error('[AUTH] Sessão não existe na requisição /api/auth/me');
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const sessionUser = (req.session as any)?.user;
    
    if (!sessionUser) {
      console.error('[AUTH] Sessão existe mas não tem usuário:', {
        sessionID: req.sessionID,
        cookieSecure: req.session.cookie.secure,
        cookieSameSite: req.session.cookie.sameSite,
      });
      return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
      const user = await getUserById(sessionUser.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        vendedor_id: user.vendedor_id,
      });

    } catch (error: any) {
      console.error('[AUTH] Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  });

  // ===========================
  // AGENT ROUTES (PROTEGIDAS)
  // ===========================
  
  // POST /api/agent/analyze - Análise principal do NEXO com OpenAI
  app.post("/api/agent/analyze", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ 
          error: 'Query inválida. Forneça uma pergunta válida.' 
        });
      }

      console.log(`[NEXO] Analisando query: ${query.substring(0, 100)}...`);

      const result = await analyzeQuery(query);

      // Salvar mensagem do usuário e resposta do agente no histórico
      const { supabase } = await import("./services/supabase");
      
      await supabase.from('chat_history').insert([
        {
          role: 'user',
          content: query,
          data: null,
        },
        {
          role: 'agent',
          content: result.response,
          data: JSON.stringify(result.data),
        }
      ]);

      return res.json({
        success: true,
        analysis: result.response,
        data: result.data,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[NEXO] Erro ao analisar query:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao processar análise',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  // GET /api/agent/history - Buscar histórico de conversas
  app.get("/api/agent/history", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const limit = parseInt(req.query.limit as string) || 50;
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Converter de volta para formato ChatMessage
      const messages = (data || []).map(record => ({
        id: record.id.toString(),
        role: record.role as 'user' | 'agent' | 'system',
        content: record.content,
        timestamp: new Date(record.created_at),
        data: record.data ? JSON.parse(record.data) : undefined,
      }));

      return res.json(messages.reverse()); // Mais antigo primeiro

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar histórico:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar histórico',
      });
    }
  });

  // DELETE /api/agent/history - Limpar histórico de conversas
  app.delete("/api/agent/history", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .neq('id', 0); // Deleta todos os registros (usando condição que sempre é true)

      if (error) throw error;

      console.log('[NEXO] Histórico de conversas limpo');
      return res.json({ success: true, message: 'Histórico limpo com sucesso' });

    } catch (error: any) {
      console.error('[NEXO] Erro ao limpar histórico:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao limpar histórico',
      });
    }
  });

  // ===========================
  // DASHBOARD ROUTES (PROTEGIDAS)
  // ===========================
  
  // GET /api/dashboard/kpis - KPIs do dashboard
  app.get("/api/dashboard/kpis", requireAuth, async (req, res) => {
    try {
      const { periodo, dataInicio, dataFim } = req.query;
      
      console.log('[NEXO] Buscando KPIs do dashboard...', { periodo, dataInicio, dataFim });

      const kpis = await getDashboardKPIs(
        periodo as string,
        dataInicio as string,
        dataFim as string
      );

      return res.json(kpis);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar KPIs:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar KPIs do dashboard',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  // Função helper para calcular data inicial
  const calcularDataInicio = (periodoStr?: string, customInicio?: string) => {
    if (customInicio) return customInicio;
    
    const hoje = new Date();
    switch (periodoStr) {
      case '7d':
        hoje.setDate(hoje.getDate() - 7);
        break;
      case '90d':
        hoje.setDate(hoje.getDate() - 90);
        break;
      case '1y':
        hoje.setFullYear(hoje.getFullYear() - 1);
        break;
      case '30d':
      default:
        hoje.setDate(hoje.getDate() - 30);
    }
    return hoje.toISOString().split('T')[0];
  };

  // GET /api/dashboard/vendas-por-vendedor - Vendas agrupadas por vendedor
  app.get("/api/dashboard/vendas-por-vendedor", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const { periodo, dataInicio, dataFim } = req.query;

      const dataInicioFiltro = calcularDataInicio(periodo as string, dataInicio as string);
      const dataFimFiltro = dataFim as string || new Date().toISOString().split('T')[0];
      
      const { data: vendedores, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome');

      if (vendedoresError) throw vendedoresError;

      const vendasPorVendedor = await Promise.all(
        (vendedores || []).map(async (vendedor) => {
          let query = supabase
            .from('pedidos')
            .select('valor')
            .eq('vendedor_id', vendedor.id)
            .eq('status', 'concluido');

          // Aplicar filtros de data
          if (dataInicioFiltro) {
            query = query.gte('data_pedido', dataInicioFiltro);
          }
          if (dataFimFiltro) {
            query = query.lte('data_pedido', dataFimFiltro);
          }

          const { data: pedidos, error: pedidosError } = await query;

          if (pedidosError) throw pedidosError;

          const total = (pedidos || []).reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0);

          return {
            vendedor: vendedor.nome,
            vendas: total,
          };
        })
      );

      return res.json(vendasPorVendedor);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar vendas por vendedor:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar vendas por vendedor',
      });
    }
  });

  // GET /api/dashboard/evolucao-receita - Evolução temporal de receita
  app.get("/api/dashboard/evolucao-receita", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const { periodo, dataInicio, dataFim } = req.query;

      const dataInicioFiltro = calcularDataInicio(periodo as string, dataInicio as string);
      const dataFimFiltro = dataFim as string || new Date().toISOString().split('T')[0];

      // Buscar todos os pedidos do período
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('data_pedido, valor')
        .gte('data_pedido', dataInicioFiltro)
        .lte('data_pedido', dataFimFiltro)
        .order('data_pedido', { ascending: true });

      if (error) throw error;

      // Agrupar por data
      const receitaPorData = new Map<string, number>();
      (pedidos || []).forEach((p: any) => {
        const data = p.data_pedido;
        receitaPorData.set(data, (receitaPorData.get(data) || 0) + parseFloat(p.valor || '0'));
      });

      // Determinar granularidade baseada no período
      const diffDias = Math.floor(
        (new Date(dataFimFiltro).getTime() - new Date(dataInicioFiltro).getTime()) / (1000 * 60 * 60 * 24)
      );

      let evolucao = [];

      if (diffDias <= 31) {
        // Granularidade diária para períodos <= 31 dias
        const dataAtual = new Date(dataInicioFiltro);
        const dataFinal = new Date(dataFimFiltro);

        while (dataAtual <= dataFinal) {
          const dataStr = dataAtual.toISOString().split('T')[0];
          evolucao.push({
            data: dataStr,
            receita: receitaPorData.get(dataStr) || 0,
          });
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      } else if (diffDias <= 180) {
        // Granularidade semanal para períodos 31-180 dias
        const receitaPorSemana = new Map<string, number>();
        receitaPorData.forEach((valor, data) => {
          const dataObj = new Date(data);
          const anoSemana = `${dataObj.getFullYear()}-S${Math.ceil((dataObj.getMonth() + 1) * 4.33)}`;
          receitaPorSemana.set(anoSemana, (receitaPorSemana.get(anoSemana) || 0) + valor);
        });

        evolucao = Array.from(receitaPorSemana.entries()).map(([periodo, receita]) => ({
          data: periodo,
          receita,
        }));
      } else {
        // Granularidade mensal para períodos > 180 dias
        const receitaPorMes = new Map<string, number>();
        receitaPorData.forEach((valor, data) => {
          const dataObj = new Date(data);
          const anoMes = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`;
          receitaPorMes.set(anoMes, (receitaPorMes.get(anoMes) || 0) + valor);
        });

        evolucao = Array.from(receitaPorMes.entries()).map(([periodo, receita]) => ({
          data: periodo,
          receita,
        }));
      }

      return res.json(evolucao);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar evolução de receita:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar evolução de receita',
      });
    }
  });

  // ===========================
  // CLIENTES ROUTES (PROTEGIDAS)
  // ===========================
  
  // GET /api/clientes - Listar todos os clientes
  app.get("/api/clientes", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar clientes:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar clientes',
      });
    }
  });

  // GET /api/clientes/:id - Buscar cliente por ID
  app.get("/api/clientes/:id", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.json(data);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar cliente:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar cliente',
      });
    }
  });

  // ===========================
  // PRODUTOS ROUTES (PROTEGIDAS)
  // ===========================
  
  // GET /api/produtos - Listar todos os produtos
  app.get("/api/produtos", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar produtos:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar produtos',
      });
    }
  });

  // ===========================
  // PEDIDOS ROUTES (PROTEGIDAS)
  // ===========================
  
  // GET /api/pedidos - Listar todos os pedidos
  app.get("/api/pedidos", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(nome), produtos(nome), vendedores(nome)')
        .order('data_pedido', { ascending: false });

      if (error) throw error;

      return res.json(data || []);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar pedidos:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar pedidos',
      });
    }
  });

  // ===========================
  // VENDEDORES ROUTES (PROTEGIDAS)
  // ===========================
  
  // GET /api/vendedores - Listar todos vendedores
  app.get("/api/vendedores", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar vendedores:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar vendedores',
      });
    }
  });

  // GET /api/vendedores/:id - Buscar vendedor por ID
  app.get("/api/vendedores/:id", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Vendedor não encontrado' });
      }

      return res.json(data);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar vendedor:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar vendedor',
      });
    }
  });

  // GET /api/vendedores/:id/performance - KPIs do vendedor
  app.get("/api/vendedores/:id/performance", requireAuth, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const { id } = req.params;
      
      // Buscar vendedor
      const { data: vendedor, error: vendedorError } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', id)
        .single();

      if (vendedorError || !vendedor) {
        return res.status(404).json({ error: 'Vendedor não encontrado' });
      }

      // Calcular vendas totais
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('valor, data_pedido')
        .eq('vendedor_id', id)
        .eq('status', 'concluido');

      if (pedidosError) throw pedidosError;

      const vendasTotais = (pedidos || []).reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0);
      const metaMensal = parseFloat(vendedor.meta_mensal?.toString() || '0');
      const comissao = vendasTotais * (parseFloat(vendedor.comissao_percentual?.toString() || '0') / 100);
      const atingimentoMeta = metaMensal > 0 ? (vendasTotais / metaMensal) * 100 : 0;

      // Contar clientes ativos
      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('vendedor_id', id)
        .eq('status', 'ativo');

      return res.json({
        vendedor: {
          id: vendedor.id,
          nome: vendedor.nome,
          email: vendedor.email,
          regiao_atuacao: vendedor.regiao_atuacao,
        },
        performance: {
          vendas_totais: vendasTotais,
          meta_mensal: metaMensal,
          atingimento_meta: atingimentoMeta,
          comissao_estimada: comissao,
          clientes_ativos: clientesAtivos || 0,
          total_pedidos: pedidos?.length || 0,
        }
      });

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar performance do vendedor:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar performance',
      });
    }
  });

  // POST /api/vendedores - Criar vendedor
  app.post("/api/vendedores", requireAdmin, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      const { nome, email, regiao, meta_mensal } = req.body;
      
      if (!nome || !email || !regiao) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome, email, regiao' });
      }

      const { data, error } = await supabase
        .from('vendedores')
        .insert([
          {
            nome,
            email,
            regiao_atuacao: regiao,
            meta_mensal: meta_mensal || 0,
            ativo: true,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return res.json(data);

    } catch (error: any) {
      console.error('[NEXO] Erro ao criar vendedor:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao criar vendedor',
      });
    }
  });

  // ===========================
  // ADMIN ROUTES (PROTEGIDAS)
  // ===========================
  
  // GET /api/admin/users - Listar usuários
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { supabase } = await import("./services/supabase");
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role, vendedor_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.json(data || []);

    } catch (error: any) {
      console.error('[NEXO] Erro ao buscar usuários:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao buscar usuários',
      });
    }
  });

  // POST /api/admin/users - Criar usuário
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { email, nome, password, role } = req.body;
      
      if (!email || !nome || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios: email, nome, password' });
      }

      const user = await createUser(email, password, nome, role || 'user');

      if (!user) {
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      });

    } catch (error: any) {
      console.error('[NEXO] Erro ao criar usuário:', error);
      return res.status(500).json({ 
        error: error.message || 'Erro ao criar usuário',
      });
    }
  });

  // ===========================
  // HEALTH CHECK
  // ===========================
  
  app.get("/api/health", (req, res) => {
    return res.json({ 
      status: 'OK', 
      service: 'NEXO MG Tools',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
