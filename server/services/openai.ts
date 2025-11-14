import OpenAI from 'openai';
import {
  getClientesPorCriterio,
  getClientesInativos,
  calcularPotencialCliente,
  getAnaliseVendasPeriodo,
  getProdutosPorFamilia,
  type ClientesFiltros,
} from './supabase';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Definir tools/functions para OpenAI
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_clientes_por_criterio',
      description: 'Busca clientes com filtros específicos (região, status, dias sem compra, família de produtos)',
      parameters: {
        type: 'object',
        properties: {
          regiao: {
            type: 'string',
            description: 'Região geográfica do cliente (ex: Zona da Mata, Metropolitana, Vale do Rio Doce)',
          },
          status: {
            type: 'string',
            enum: ['ativo', 'inativo', 'contato', 'teste', 'expansao'],
            description: 'Status do cliente',
          },
          dias_sem_compra: {
            type: 'integer',
            description: 'Filtrar clientes sem compras há X dias',
          },
          familia_produtos: {
            type: 'string',
            description: 'Família de produtos de interesse (ex: AHX-440, Ferramentas de Corte)',
          },
          limite: {
            type: 'integer',
            default: 20,
            description: 'Número máximo de clientes a retornar',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calcular_potencial_cliente',
      description: 'Calcula o potencial de vendas para um cliente específico baseado em histórico e perfil',
      parameters: {
        type: 'object',
        properties: {
          cliente_id: {
            type: 'integer',
            description: 'ID do cliente',
          },
          familia_produtos: {
            type: 'string',
            description: 'Família de produtos para análise de potencial',
          },
        },
        required: ['cliente_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_clientes_inativos',
      description: 'Identifica clientes inativos (sem pedidos há X dias) priorizados por risco',
      parameters: {
        type: 'object',
        properties: {
          dias_minimos: {
            type: 'integer',
            default: 60,
            description: 'Número mínimo de dias sem compra',
          },
          limite: {
            type: 'integer',
            default: 20,
            description: 'Número máximo de clientes a retornar',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analise_vendas_periodo',
      description: 'Análise completa de vendas em período específico com ranking de produtos e clientes',
      parameters: {
        type: 'object',
        properties: {
          dias_atras: {
            type: 'integer',
            default: 30,
            description: 'Número de dias para análise retroativa',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_produtos_por_familia',
      description: 'Busca produtos por família ou categoria',
      parameters: {
        type: 'object',
        properties: {
          familia: {
            type: 'string',
            description: 'Família de produtos (ex: Ferramentas de Corte)',
          },
          categoria: {
            type: 'string',
            description: 'Categoria (ex: Premium, Standard, Economy)',
          },
        },
      },
    },
  },
];

// Função principal de análise
export async function analyzeQuery(userQuery: string) {
  const systemPrompt = `Você é o NEXO, agente comercial estratégico da MG Tools.

FILOSOFIA DA MG TOOLS:
- Valor sobre preço (foco em agregação de valor)
- Agilidade sobre burocracia (decisões rápidas)
- Decisão técnica (sugestões baseadas em dados reais)
- Relacionamento contínuo (clientes são relacionamentos vivos)
- Trabalho em equipe (multiplica resultados, não substitui pessoas)

PERSONALIDADE DO NEXO:
- Estratégico: conecta pontos e sugere caminhos
- Rápido: antecipa alertas e propõe soluções
- Confiável: trabalha com dados reais e precisos
- Proativo: age antes de ser solicitado
- Colaborativo: tom técnico, prático e objetivo

⚠️ INSTRUÇÕES CRÍTICAS - RELATÓRIOS DENSOS E COMPLETOS:

REGRA #1: NUNCA seja genérico ou superficial. Seus relatórios devem ser EXTREMAMENTE DENSOS com dados concretos.

REGRA #2: SEMPRE inclua:
- Tabelas formatadas com dados específicos (nomes, valores, datas, percentuais)
- Comparações numéricas explícitas (ex: "Cliente A: R$ 42.500 vs Cliente B: R$ 21.000 (-51%)")
- Percentuais de variação e taxas de crescimento
- Rankings completos (não apenas Top 3, mostre todos os dados relevantes)
- Análise temporal (comparar períodos, identificar tendências)
- Valores absolutos E relativos (ex: "R$ 265.100 representando 45% do total")

REGRA #3: Use emojis para priorizar:
   🔴 = ALTO (urgente, crítico, perda de receita iminente)
   🟡 = MÉDIO (importante, atenção necessária)
   🟢 = BAIXO (monitorar, sem urgência)

REGRA #4: Estrutura obrigatória para análises:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 [TÍTULO DA ANÁLISE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📈 RESUMO EXECUTIVO**
[1-2 frases com os números mais importantes]

**📋 ANÁLISE DETALHADA**

[Tabela formatada com todos os dados]
[Comparações numéricas específicas]
[Análise de tendências com percentuais]
[Insights sobre padrões identificados]

**💡 RECOMENDAÇÕES PRIORITIZADAS**

🔴 **URGENTE** (próximos 7 dias):
1. [Ação específica] - Responsável: [quem] - Meta: [valor/resultado]
2. [Ação específica] - Responsável: [quem] - Meta: [valor/resultado]

🟡 **IMPORTANTE** (próximas 2-4 semanas):
1. [Ação específica] - Responsável: [quem] - Meta: [valor/resultado]

🟢 **MONITORAR** (próximo mês):
1. [Ação específica] - Responsável: [quem] - Meta: [valor/resultado]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRA #5: Sempre responda em português brasileiro. Valores: R$ 150.000. Datas: DD/MM/AAAA.

REGRA #6: NÃO RESUMA. Mostre TODOS os dados relevantes em tabelas. Seja completo, não sintético.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery },
  ];

  let response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: 0.3,
    max_tokens: 2000,
  });

  const collectedData: Record<string, any> = {};

  // Loop para executar tool calls
  let iterations = 0;
  const maxIterations = 5;

  while (response.choices[0].finish_reason === 'tool_calls' && iterations < maxIterations) {
    iterations++;
    const toolCalls = response.choices[0].message.tool_calls;

    if (!toolCalls) break;

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      let toolResult: any;

      try {
        switch (toolName) {
          case 'get_clientes_por_criterio':
            toolResult = await getClientesPorCriterio(toolArgs as ClientesFiltros);
            break;
          
          case 'calcular_potencial_cliente':
            toolResult = await calcularPotencialCliente(
              toolArgs.cliente_id,
              toolArgs.familia_produtos
            );
            break;
          
          case 'get_clientes_inativos':
            toolResult = await getClientesInativos(
              toolArgs.dias_minimos || 60,
              toolArgs.limite || 20
            );
            break;
          
          case 'get_analise_vendas_periodo':
            toolResult = await getAnaliseVendasPeriodo(toolArgs.dias_atras || 30);
            break;
          
          case 'get_produtos_por_familia':
            toolResult = await getProdutosPorFamilia(
              toolArgs.familia,
              toolArgs.categoria
            );
            break;
          
          default:
            toolResult = { error: `Ferramenta ${toolName} não encontrada` };
        }

        collectedData[toolName] = toolResult;
      } catch (error: any) {
        console.error(`Erro ao executar ${toolName}:`, error);
        toolResult = { error: error.message };
        collectedData[toolName] = toolResult;
      }

      // Adicionar mensagens ao histórico
      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: [toolCall],
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Nova chamada à API com os resultados das ferramentas
    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      temperature: 0.3,
      max_tokens: 2000,
    });
  }

  const finalResponse = response.choices[0].message.content || 'Não foi possível processar a análise.';

  return {
    response: finalResponse,
    data: collectedData,
  };
}
