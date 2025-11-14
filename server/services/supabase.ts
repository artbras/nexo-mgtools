import { createClient } from '@supabase/supabase-js';
import type { Cliente, Produto, Pedido } from '@shared/schema';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ===============================
// FUNÇÕES DE QUERY - CLIENTES
// ===============================

export interface ClientesFiltros {
  regiao?: string;
  status?: string;
  dias_sem_compra?: number;
  familia_produtos?: string;
  limite?: number;
}

export async function getClientesPorCriterio(filtros: ClientesFiltros) {
  let query = supabase.from('clientes').select('*');

  if (filtros.regiao) {
    query = query.eq('regiao', filtros.regiao);
  }

  if (filtros.status) {
    query = query.eq('status', filtros.status);
  }

  if (filtros.familia_produtos) {
    query = query.ilike('familia_produtos', `%${filtros.familia_produtos}%`);
  }

  if (filtros.dias_sem_compra) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - filtros.dias_sem_compra);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    query = query.lt('ultima_compra', dataLimiteStr);
  }

  const { data, error } = await query
    .limit(filtros.limite || 20)
    .order('potencial', { ascending: false });

  if (error) {
    console.error('Erro ao buscar clientes:', error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }

  return data || [];
}

export async function getClientesInativos(dias_minimos: number = 60, limite: number = 20) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias_minimos);
  const dataLimiteStr = dataLimite.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .lt('ultima_compra', dataLimiteStr)
    .order('ultima_compra', { ascending: true })
    .limit(limite);

  if (error) {
    console.error('Erro ao buscar clientes inativos:', error);
    throw new Error(`Erro ao buscar clientes inativos: ${error.message}`);
  }

  // Calcular dias sem compra
  const clientesComDias = (data || []).map(cliente => {
    const ultimaCompra = new Date(cliente.ultima_compra);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - ultimaCompra.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      ...cliente,
      dias_sem_compra: diffDays,
      prioridade: diffDays > 90 ? 'alto' : diffDays > 60 ? 'medio' : 'baixo'
    };
  });

  return clientesComDias;
}

export async function calcularPotencialCliente(cliente_id: number, familia_produtos?: string) {
  // Buscar cliente
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', cliente_id)
    .single();

  if (clienteError || !cliente) {
    throw new Error(`Cliente não encontrado: ${clienteError?.message}`);
  }

  // Buscar histórico de pedidos do cliente
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('*, produtos(*)')
    .eq('cliente_id', cliente_id)
    .order('data_pedido', { ascending: false })
    .limit(12);

  if (pedidosError) {
    throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
  }

  // Calcular métricas
  const totalCompras = pedidos?.length || 0;
  const valorTotal = pedidos?.reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0) || 0;
  const ticketMedio = totalCompras > 0 ? valorTotal / totalCompras : 0;

  // Calcular tendência (últimos 3 meses vs 3 meses anteriores)
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje.setMonth(hoje.getMonth() - 3));
  const seisMesesAtras = new Date(tresMesesAtras.getTime());
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 3);

  const comprasRecentes = pedidos?.filter(p => 
    new Date(p.data_pedido) >= tresMesesAtras
  ) || [];
  
  const comprasAnteriores = pedidos?.filter(p => {
    const data = new Date(p.data_pedido);
    return data < tresMesesAtras && data >= seisMesesAtras;
  }) || [];

  const valorRecente = comprasRecentes.reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);
  const valorAnterior = comprasAnteriores.reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);

  let tendencia: 'crescente' | 'estavel' | 'decrescente' = 'estavel';
  if (valorRecente > valorAnterior * 1.1) {
    tendencia = 'crescente';
  } else if (valorRecente < valorAnterior * 0.9) {
    tendencia = 'decrescente';
  }

  return {
    cliente,
    total_compras: totalCompras,
    valor_total: valorTotal,
    ticket_medio: ticketMedio,
    potencial_estimado: parseFloat(cliente.potencial || '0'),
    tendencia,
    familia_produtos: cliente.familia_produtos,
    maquinario: cliente.maquinario,
    material_usinado: cliente.material_usinado,
  };
}

// ===============================
// FUNÇÕES DE QUERY - PRODUTOS
// ===============================

export async function getProdutosPorFamilia(familia?: string, categoria?: string) {
  let query = supabase.from('produtos').select('*');

  if (familia) {
    query = query.eq('familia', familia);
  }

  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  const { data, error } = await query.order('nome', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }

  return data || [];
}

// ===============================
// FUNÇÕES DE QUERY - ANÁLISES
// ===============================

export async function getAnaliseVendasPeriodo(dias_atras: number = 30) {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias_atras);
  const dataInicioStr = dataInicio.toISOString().split('T')[0];

  // Buscar pedidos do período
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*, clientes(nome), produtos(nome, familia)')
    .gte('data_pedido', dataInicioStr)
    .order('data_pedido', { ascending: false });

  if (error) {
    throw new Error(`Erro ao analisar vendas: ${error.message}`);
  }

  const pedidosData = pedidos || [];

  // Calcular totais
  const faturamento_total = pedidosData.reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);

  // Buscar pedidos do período anterior para comparação
  const dataAnterior = new Date(dataInicio);
  dataAnterior.setDate(dataAnterior.getDate() - dias_atras);
  const dataAnteriorStr = dataAnterior.toISOString().split('T')[0];

  const { data: pedidosAnteriores } = await supabase
    .from('pedidos')
    .select('valor')
    .gte('data_pedido', dataAnteriorStr)
    .lt('data_pedido', dataInicioStr);

  const faturamento_anterior = (pedidosAnteriores || []).reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);
  const variacao_percentual = faturamento_anterior > 0
    ? ((faturamento_total - faturamento_anterior) / faturamento_anterior) * 100
    : 0;

  // Top produtos
  const produtosMap = new Map<string, { valor: number; nome: string }>();
  pedidosData.forEach(p => {
    const nome = p.produtos?.nome || 'Desconhecido';
    const atual = produtosMap.get(nome) || { valor: 0, nome };
    atual.valor += parseFloat(p.valor || '0');
    produtosMap.set(nome, atual);
  });

  const top_produtos = Array.from(produtosMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)
    .map(p => ({ nome: p.nome, valor: p.valor, variacao: 0 }));

  // Top clientes
  const clientesMap = new Map<string, { valor: number; nome: string }>();
  pedidosData.forEach(p => {
    const nome = p.clientes?.nome || 'Desconhecido';
    const atual = clientesMap.get(nome) || { valor: 0, nome };
    atual.valor += parseFloat(p.valor || '0');
    clientesMap.set(nome, atual);
  });

  const top_clientes = Array.from(clientesMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return {
    periodo: `Últimos ${dias_atras} dias`,
    faturamento_total,
    variacao_percentual,
    top_produtos,
    top_clientes,
  };
}

// ===============================
// FUNÇÕES DE QUERY - DASHBOARD
// ===============================

export async function getDashboardKPIs(periodo?: string, customDataInicio?: string, customDataFim?: string) {
  // Calcular datas baseadas no período
  const calcularDatas = () => {
    if (customDataInicio && customDataFim) {
      // Calcular período anterior com mesmo tamanho para datas customizadas
      const inicio = new Date(customDataInicio);
      const fim = new Date(customDataFim);
      const diffDias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      const periodoAnteriorFim = new Date(inicio);
      periodoAnteriorFim.setDate(periodoAnteriorFim.getDate() - 1); // Um dia antes do período atual
      
      const periodoAnteriorInicio = new Date(periodoAnteriorFim);
      periodoAnteriorInicio.setDate(periodoAnteriorInicio.getDate() - diffDias);
      
      return {
        dataInicioStr: customDataInicio,
        dataFimStr: customDataFim,
        dataAnteriorStr: customDataInicio,
        periodoAnteriorInicioStr: periodoAnteriorInicio.toISOString().split('T')[0],
        periodoAnteriorFimStr: periodoAnteriorFim.toISOString().split('T')[0],
      };
    }

    const hoje = new Date();
    const dataInicio = new Date();
    
    switch (periodo) {
      case '7d':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case '90d':
        dataInicio.setDate(hoje.getDate() - 90);
        break;
      case '1y':
        dataInicio.setFullYear(hoje.getFullYear() - 1);
        break;
      case '30d':
      default:
        dataInicio.setDate(hoje.getDate() - 30);
    }

    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    const dataFimStr = hoje.toISOString().split('T')[0];

    // Período anterior (mesmo tamanho do período atual)
    const diffDias = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const periodoAnteriorInicio = new Date(dataInicio);
    periodoAnteriorInicio.setDate(periodoAnteriorInicio.getDate() - diffDias);
    
    return {
      dataInicioStr,
      dataFimStr,
      dataAnteriorStr: dataInicioStr,
      periodoAnteriorInicioStr: periodoAnteriorInicio.toISOString().split('T')[0],
      periodoAnteriorFimStr: dataInicioStr, // Vai até o dia anterior ao período atual
    };
  };

  const { dataInicioStr, dataFimStr, periodoAnteriorInicioStr, periodoAnteriorFimStr } = calcularDatas();

  // Total de clientes
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true });

  // Clientes ativos
  const { count: clientesAtivos } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo');

  // Clientes inativos (60+ dias sem compra)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 60);
  const dataLimiteStr = dataLimite.toISOString().split('T')[0];

  const { count: clientesInativos } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .lt('ultima_compra', dataLimiteStr);

  // Cotações abertas (soma de orçamentos abertos)
  const { data: orcamentos } = await supabase
    .from('clientes')
    .select('orcamento_aberto');

  const cotacoesAbertas = (orcamentos || [])
    .reduce((sum, c) => sum + parseFloat(c.orcamento_aberto || '0'), 0);

  // Receita do período atual
  const { data: pedidosMes } = await supabase
    .from('pedidos')
    .select('valor')
    .gte('data_pedido', dataInicioStr)
    .lte('data_pedido', dataFimStr);

  const receitaMensal = (pedidosMes || [])
    .reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);

  // Receita do período anterior
  const { data: pedidosAnterior } = await supabase
    .from('pedidos')
    .select('valor')
    .gte('data_pedido', periodoAnteriorInicioStr)
    .lte('data_pedido', periodoAnteriorFimStr || dataInicioStr);

  const receitaAnterior = (pedidosAnterior || [])
    .reduce((sum, p) => sum + parseFloat(p.valor || '0'), 0);

  // Top produtos
  const { data: topProdutosData } = await supabase
    .from('pedidos')
    .select('valor, produtos(nome)')
    .gte('data_pedido', dataInicioStr)
    .lte('data_pedido', dataFimStr);

  const produtosMap = new Map<string, number>();
  (topProdutosData || []).forEach((p: any) => {
    const nome = p.produtos?.nome || 'Desconhecido';
    produtosMap.set(nome, (produtosMap.get(nome) || 0) + parseFloat(p.valor || '0'));
  });

  const topProdutos = Array.from(produtosMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, valor]) => ({
      nome,
      valor,
      percentual: receitaMensal > 0 ? (valor / receitaMensal) * 100 : 0
    }));

  // Top clientes
  const { data: topClientesData } = await supabase
    .from('pedidos')
    .select('valor, clientes(nome)')
    .gte('data_pedido', dataInicioStr)
    .lte('data_pedido', dataFimStr);

  const clientesMap = new Map<string, number>();
  (topClientesData || []).forEach((p: any) => {
    const nome = p.clientes?.nome || 'Desconhecido';
    clientesMap.set(nome, (clientesMap.get(nome) || 0) + parseFloat(p.valor || '0'));
  });

  const topClientes = Array.from(clientesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, valor]) => ({ nome, valor }));

  return {
    totalClientes: totalClientes || 0,
    clientesAtivos: clientesAtivos || 0,
    clientesInativos: clientesInativos || 0,
    cotacoesAbertas,
    receitaMensal,
    receitaAnterior,
    topProdutos,
    topClientes,
  };
}
