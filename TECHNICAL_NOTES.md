# 🔧 Notas Técnicas - NEXO MG Tools

Documentação técnica para desenvolvedores e mantenedores do sistema.

---

## 📐 Arquitetura

### Stack Completo

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  - Pages: Dashboard, Chat, Histórico    │
│  - Components: Shadcn UI customizado    │
│  - State: React Query + local state     │
│  - Routing: Wouter                      │
│  - Styling: Tailwind CSS                │
└─────────────────────────────────────────┘
                    ↕ HTTP/REST
┌─────────────────────────────────────────┐
│         Backend (Express API)           │
│  - Routes: /api/agent, /api/dashboard   │
│  - Services: OpenAI, Supabase           │
│  - Middleware: CORS, JSON parsing       │
└─────────────────────────────────────────┘
                    ↕
        ┌───────────────────┐
        │  External APIs    │
        ├───────────────────┤
        │ OpenAI GPT-4o-mini│
        │ Supabase Postgres │
        └───────────────────┘
```

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### `clientes`
```sql
id                SERIAL PRIMARY KEY
nome              VARCHAR(255)
grupo             VARCHAR(100)
potencial         DECIMAL(10,2)
entrada_pedidos   DATE
orcamento_aberto  DECIMAL(10,2)
meta              DECIMAL(10,2)
ultima_compra     DATE
ultima_visita     DATE
valor_testes      DECIMAL(10,2)
maquinario        VARCHAR(255)
material_usinado  VARCHAR(255)
tipo_servico      VARCHAR(255)
familia_produtos  VARCHAR(255)
status            VARCHAR(50)    -- ativo, inativo, contato, teste, expansao
regiao            VARCHAR(100)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

#### `produtos`
```sql
id          SERIAL PRIMARY KEY
nome        VARCHAR(255)
familia     VARCHAR(100)
categoria   VARCHAR(100)
descricao   TEXT
preco_base  DECIMAL(10,2)
created_at  TIMESTAMP
```

#### `pedidos`
```sql
id           SERIAL PRIMARY KEY
cliente_id   INTEGER FK → clientes(id)
produto_id   INTEGER FK → produtos(id)
valor        DECIMAL(10,2)
data_pedido  DATE
status       VARCHAR(50)    -- pendente, processando, concluido, cancelado
created_at   TIMESTAMP
```

#### `chat_history`
```sql
id          SERIAL PRIMARY KEY
role        VARCHAR(20)    -- user, agent, system
content     TEXT
data        TEXT           -- JSON stringificado dos dados retornados
created_at  TIMESTAMP
```

### Índices

```sql
-- Performance crítica
idx_clientes_status
idx_clientes_regiao
idx_clientes_ultima_compra
idx_clientes_grupo
idx_pedidos_cliente
idx_pedidos_data
idx_pedidos_status
idx_produtos_familia
idx_chat_history_created_at
```

---

## 🤖 Integração OpenAI

### Function Calling

O NEXO usa **5 functions** principais que o GPT-4o-mini pode chamar:

#### 1. `get_clientes_por_criterio`
Filtro avançado de clientes.

**Parâmetros:**
```typescript
{
  regiao?: string
  status?: 'ativo' | 'inativo' | 'contato' | 'teste' | 'expansao'
  dias_sem_compra?: number
  familia_produtos?: string
  limit?: number
}
```

**SQL gerada (exemplo):**
```sql
SELECT * FROM clientes 
WHERE regiao = 'Zona da Mata'
  AND status = 'ativo'
  AND ultima_compra < CURRENT_DATE - INTERVAL '60 days'
ORDER BY potencial DESC
LIMIT 10;
```

#### 2. `calcular_potencial_cliente`
Análise de potencial e tendência de vendas.

**Parâmetros:**
```typescript
{
  cliente_id: number
}
```

**Lógica:**
```typescript
1. Buscar cliente no Supabase
2. Calcular vendas últimos 30 dias
3. Calcular vendas 30-60 dias atrás
4. Determinar tendência:
   - crescente: vendas_recentes > vendas_anteriores * 1.1
   - decrescente: vendas_recentes < vendas_anteriores * 0.9
   - estável: caso contrário
5. Retornar: { cliente, potencial, vendas, tendencia }
```

#### 3. `get_clientes_inativos`
Clientes sem pedidos há X dias.

**Parâmetros:**
```typescript
{
  dias: number        // padrão: 60
  limit?: number      // padrão: 20
}
```

**SQL:**
```sql
SELECT c.*, 
       MAX(p.data_pedido) as ultima_compra_real
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
GROUP BY c.id
HAVING MAX(p.data_pedido) < CURRENT_DATE - INTERVAL '60 days'
   OR MAX(p.data_pedido) IS NULL
ORDER BY ultima_compra_real DESC NULLS LAST
LIMIT 20;
```

#### 4. `get_analise_vendas_periodo`
Análise de vendas e rankings.

**Parâmetros:**
```typescript
{
  data_inicio: string    // ISO date
  data_fim: string       // ISO date
}
```

**Retorno:**
```typescript
{
  periodo: { inicio, fim },
  total_vendas: number,
  total_pedidos: number,
  ticket_medio: number,
  produtos_mais_vendidos: Array<{
    produto_nome: string,
    total_vendido: number,
    quantidade_pedidos: number
  }>,
  clientes_mais_compraram: Array<{
    cliente_nome: string,
    total_comprado: number,
    quantidade_pedidos: number
  }>
}
```

#### 5. `get_produtos_por_familia`
Consulta de produtos por família.

**Parâmetros:**
```typescript
{
  familia?: string
}
```

### System Prompt

O NEXO é configurado com este system prompt:

```
Você é o NEXO, agente comercial estratégico da MG Tools...

Filosofia MG Tools:
- Valor sobre preço
- Agilidade sobre burocracia
- Decisão técnica: Traga dados, não opiniões
- Relacionamento contínuo: Cliente não é transação
- Trabalho em equipe: Multiplica, não substitui

SEMPRE:
1. Respostas em português brasileiro (pt-BR)
2. Formato markdown claro
3. Priorize com badges: 🔴 Alto | 🟡 Médio | 🟢 Baixo
4. Dados reais usando as 5 functions
5. Insights acionáveis com prazos e responsáveis
6. Tom estratégico, rápido, confiável, proativo

NUNCA:
- Invente dados
- Respostas genéricas
- Apenas liste informações sem insights
```

---

## 🔐 Segurança e Permissões

### Variáveis de Ambiente

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://obhdvwuszxcdgtinvtjg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Session (opcional)
SESSION_SECRET=your-secret-here
```

### Row Level Security (RLS)

**IMPORTANTE**: Como usamos `SERVICE_ROLE_KEY`, o RLS do Supabase é **ignorado**.

Isso significa:
- ✅ Backend tem acesso total a todas as tabelas
- ✅ Não precisa configurar políticas RLS
- ⚠️ Nunca exponha `SERVICE_ROLE_KEY` no frontend

Se futuramente quiser adicionar RLS:

```sql
-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política exemplo (apenas leitura pública)
CREATE POLICY "Público pode ler clientes"
  ON clientes FOR SELECT
  USING (true);
```

---

## 🚀 Performance

### React Query Configuration

```typescript
// client/src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutos
      cacheTime: 10 * 60 * 1000,     // 10 minutos
      refetchOnWindowFocus: false,    // Não refetch ao focar janela
      retry: 1,                       // Apenas 1 retry
    },
  },
});
```

### Cache Strategy

- **Dashboard KPIs**: Cache de 5 minutos, invalidado manualmente
- **Chat History**: Cache de 10 minutos, invalidado após cada mensagem
- **Clientes/Produtos/Pedidos**: Cache de 10 minutos

### OpenAI Rate Limits

- **GPT-4o-mini**: 10,000 RPM (requests per minute)
- **Timeout**: 30 segundos por request
- **Retry**: Nenhum (para evitar custos duplos)

---

## 🎨 Design Tokens

### Cores (Tailwind CSS)

```css
/* client/src/index.css */
:root {
  --primary: 16 100% 61%;           /* Laranja #FF6B35 */
  --primary-foreground: 0 0% 100%;  /* Branco */
  
  --secondary: 210 29% 24%;         /* Azul #2C3E50 */
  --secondary-foreground: 0 0% 100%;
  
  --accent: 142 76% 36%;            /* Verde #22C55E */
  --destructive: 0 84% 60%;         /* Vermelho #EF4444 */
  --warning: 45 93% 47%;            /* Amarelo #EAB308 */
}
```

### Tipografia

```css
font-family: 'Inter', sans-serif;
font-weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

### Spacing Scale

```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

---

## 🧪 Testing

### Testes Manuais Essenciais

1. **Dashboard carrega KPIs**
   - Verificar se valores não são 0
   - Confirmar que gráficos renderizam

2. **Chat responde corretamente**
   - Testar quick actions
   - Fazer pergunta customizada
   - Verificar se histórico é salvo

3. **Dark mode funciona**
   - Alternar tema
   - Confirmar contraste adequado

### Endpoints para Testar com cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Dashboard KPIs
curl http://localhost:5000/api/dashboard/kpis

# Clientes
curl http://localhost:5000/api/clientes

# Chat (POST)
curl -X POST http://localhost:5000/api/agent/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"Quais clientes estão inativos?"}'

# Histórico de chat
curl http://localhost:5000/api/agent/history
```

---

## 🐛 Debugging

### Logs do Backend

```typescript
// server/routes.ts
console.log('[NEXO] Analisando query:', query);
console.log('[NEXO] Resultado OpenAI:', result);
console.error('[NEXO] Erro ao analisar:', error);
```

**Onde ver**: Console do Replit ou `docker logs` se containerizado

### Logs do Frontend

Abra DevTools (F12) → Console:

```javascript
// React Query Devtools (desenvolvimento)
// Automaticamente disponível em modo dev
```

### Problemas Comuns

#### 1. OpenAI retorna erro 401
**Causa**: API key inválida ou expirada

**Solução**:
```bash
# Verificar se a key está correta
echo $OPENAI_API_KEY

# Testar manualmente
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### 2. Supabase retorna 404
**Causa**: Tabela não existe ou RLS bloqueando

**Solução**:
```sql
-- Verificar se tabelas existem
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';

-- Desabilitar RLS se necessário
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
```

#### 3. Chat não salva histórico
**Causa**: Tabela `chat_history` não criada

**Solução**: Execute o script SQL completo do `DATABASE_SETUP.md`

---

## 📊 Monitoramento

### Métricas Importantes

- **OpenAI Usage**: Dashboard da OpenAI → Usage
- **Supabase Database**: Dashboard Supabase → Database → Logs
- **API Errors**: Logs do Express (console)

### Custos Estimados

**OpenAI GPT-4o-mini:**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens
- Média por query: ~2000 tokens = $0.0015

**Supabase:**
- Free tier: até 500MB database
- Bandwidth: 5GB/mês grátis

---

## 🔄 Atualizações e Manutenção

### Adicionar Nova Function ao OpenAI

1. Criar função em `server/services/supabase.ts`:
```typescript
export async function minhaNovaFunction(parametros) {
  const { data, error } = await supabase
    .from('tabela')
    .select('*')
    .eq('campo', parametros.valor);
  
  if (error) throw error;
  return data;
}
```

2. Registrar em `server/services/openai.ts`:
```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "minha_nova_function",
      description: "Descrição clara do que faz",
      parameters: { /* schema JSON */ }
    }
  },
  // ... outras functions
];
```

3. Adicionar case no switch:
```typescript
case 'minha_nova_function':
  result = await minhaNovaFunction(args);
  break;
```

### Atualizar Dados de Exemplo

Execute novos INSERTs no Supabase SQL Editor:

```sql
INSERT INTO clientes (nome, regiao, status, potencial)
VALUES ('Novo Cliente', 'Norte', 'ativo', 50000.00);
```

---

## 📝 Changelog

### v1.0.0 (Nov 2024)
- ✅ Dashboard com KPIs e gráficos Recharts
- ✅ Chat com NEXO usando GPT-4o-mini
- ✅ 5 functions OpenAI (clientes, produtos, vendas)
- ✅ Histórico de conversas persistente
- ✅ Dark mode completo
- ✅ Design MG Tools (laranja/azul)
- ✅ Documentação completa

---

## 🛣️ Roadmap Futuro

### Features Potenciais

- [ ] **Exportação de análises** (PDF/CSV)
- [ ] **Alertas automáticos** (clientes inativos, metas não atingidas)
- [ ] **Dashboard customizável** (drag-and-drop de KPIs)
- [ ] **Multi-idioma** (EN, ES além de PT-BR)
- [ ] **Integração com CRM** (Pipedrive, HubSpot)
- [ ] **WhatsApp Bot** (NEXO via WhatsApp Business)
- [ ] **Voice mode** (conversar com NEXO por voz)

### Melhorias Técnicas

- [ ] **Testes automatizados** (Jest, Playwright)
- [ ] **CI/CD pipeline** (GitHub Actions)
- [ ] **Observabilidade** (Sentry, Datadog)
- [ ] **Cache Redis** (para queries frequentes)
- [ ] **WebSockets** (atualizações em tempo real)

---

**Documentação mantida por**: Dev Team MG Tools
**Última atualização**: Novembro 2024
