# 📊 Setup do Banco de Dados - NEXO MG Tools

Este arquivo contém os scripts SQL necessários para configurar o banco de dados Supabase do NEXO.

## 🔧 Como Executar

1. Acesse seu projeto Supabase: https://obhdvwuszxcdgtinvtjg.supabase.co
2. Vá em **SQL Editor** (no menu lateral)
3. Crie uma nova query
4. **Copie e execute TODO o script abaixo**

---

## 📝 Script SQL Completo

```sql
-- ==========================================
-- SCRIPT SQL - AGENTE NEXO MG TOOLS FASE 2
-- Database: Supabase PostgreSQL
-- Inclui: vendedores, users, clientes, produtos, pedidos, chat_history
-- ==========================================

-- Tabela: vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(50),
  regiao_atuacao VARCHAR(100),
  meta_mensal DECIMAL(10,2),
  comissao_percentual DECIMAL(5,2),
  status VARCHAR(50) CHECK (status IN ('ativo', 'inativo', 'ferias')),
  data_contratacao DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: users (vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'vendedor', 'gerente')),
  vendedor_id INTEGER REFERENCES vendedores(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  grupo VARCHAR(100),
  potencial DECIMAL(10,2),
  entrada_pedidos DATE,
  orcamento_aberto DECIMAL(10,2) DEFAULT 0,
  meta DECIMAL(10,2),
  ultima_compra DATE,
  ultima_visita DATE,
  valor_testes DECIMAL(10,2) DEFAULT 0,
  maquinario VARCHAR(255),
  material_usinado VARCHAR(255),
  tipo_servico VARCHAR(255),
  familia_produtos VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('ativo', 'inativo', 'contato', 'teste', 'expansao')),
  regiao VARCHAR(100),
  vendedor_id INTEGER REFERENCES vendedores(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: produtos
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  familia VARCHAR(100),
  categoria VARCHAR(100),
  descricao TEXT,
  preco_base DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  vendedor_id INTEGER REFERENCES vendedores(id),
  valor DECIMAL(10,2) NOT NULL,
  data_pedido DATE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pendente', 'processando', 'concluido', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: chat_history (histórico de conversas com o NEXO)
CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para otimização de performance
CREATE INDEX IF NOT EXISTS idx_vendedores_status ON vendedores(status);
CREATE INDEX IF NOT EXISTS idx_vendedores_regiao ON vendedores(regiao_atuacao);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_regiao ON clientes(regiao);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_compra ON clientes(ultima_compra);
CREATE INDEX IF NOT EXISTS idx_clientes_grupo ON clientes(grupo);
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON pedidos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_familia ON produtos(familia);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_vendedores_updated_at ON vendedores;
CREATE TRIGGER update_vendedores_updated_at
BEFORE UPDATE ON vendedores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DADOS DE EXEMPLO (OPCIONAL - para testes)
-- ==========================================

-- Inserir vendedores exemplo
INSERT INTO vendedores (nome, email, telefone, regiao_atuacao, meta_mensal, comissao_percentual, status, data_contratacao) VALUES
('João Silva', 'joao@mgtools.com', '31 98765-4321', 'Zona da Mata', 200000.00, 5.00, 'ativo', '2023-01-10'),
('Maria Santos', 'maria@mgtools.com', '31 98765-4322', 'Metropolitana', 250000.00, 5.50, 'ativo', '2023-03-15'),
('Carlos Souza', 'carlos@mgtools.com', '31 98765-4323', 'Vale do Rio Doce', 180000.00, 4.50, 'ativo', '2023-06-20')
ON CONFLICT (email) DO NOTHING;

-- Inserir users exemplo (vinculados ao Supabase Auth)
-- IMPORTANTE: Após criar estes usuários no Supabase Auth Dashboard, use os UUIDs reais aqui
-- Por enquanto, usando UUIDs fictícios - SUBSTITUA pelos UUIDs do Supabase Auth
INSERT INTO users (id, email, nome, role, vendedor_id) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@mgtools.com', 'Administrador', 'admin', NULL),
('00000000-0000-0000-0000-000000000002', 'joao@mgtools.com', 'João Silva', 'vendedor', 1),
('00000000-0000-0000-0000-000000000003', 'maria@mgtools.com', 'Maria Santos', 'vendedor', 2)
ON CONFLICT (id) DO NOTHING;

-- Inserir produtos exemplo
INSERT INTO produtos (nome, familia, categoria, descricao, preco_base) VALUES
('AHX-440', 'Ferramentas de Corte', 'Premium', 'Ferramenta de alta precisão para usinagem CNC', 850.00),
('MH-250', 'Ferramentas de Corte', 'Standard', 'Ferramenta padrão para fresamento', 420.00),
('Standard Line', 'Ferramentas Básicas', 'Economy', 'Linha econômica para operações básicas', 180.00),
('Pro-Cut 500', 'Ferramentas de Corte', 'Premium', 'Sistema profissional de corte', 1200.00),
('Basic Tool Kit', 'Ferramentas Básicas', 'Economy', 'Kit básico de ferramentas', 95.00)
ON CONFLICT DO NOTHING;

-- Inserir clientes exemplo (vinculados a vendedores)
INSERT INTO clientes (nome, grupo, potencial, entrada_pedidos, orcamento_aberto, meta, ultima_compra, ultima_visita, valor_testes, maquinario, material_usinado, tipo_servico, familia_produtos, status, regiao, vendedor_id) VALUES
('Metalúrgica Pimenta', 'Industrial', 150000.00, '2024-01-15', 25000.00, 180000.00, '2024-10-20', '2024-11-01', 5000.00, 'CNC 4 eixos, Fresadora vertical', 'Aço inox, Alumínio', 'Usinagem de precisão', 'Ferramentas de Corte', 'ativo', 'Zona da Mata', 1),
('Poçostec Usinagem', 'Industrial', 120000.00, '2024-02-10', 18000.00, 140000.00, '2024-10-18', '2024-10-25', 3000.00, 'Fresadora vertical, Torno CNC', 'Aço carbono, Alumínio', 'Usinagem geral', 'Ferramentas de Corte', 'ativo', 'Zona da Mata', 1),
('Usinagem Central', 'Industrial', 90000.00, '2023-11-20', 0.00, 100000.00, '2024-08-15', '2024-06-10', 0.00, 'Torno convencional', 'Aço carbono', 'Usinagem básica', 'Ferramentas Básicas', 'inativo', 'Metropolitana', 2),
('Metalúrgica do Vale', 'Industrial', 75000.00, '2024-03-05', 12000.00, 85000.00, '2024-09-22', '2024-10-15', 2000.00, 'CNC 3 eixos', 'Alumínio, Bronze', 'Usinagem de precisão', 'Ferramentas de Corte', 'ativo', 'Vale do Rio Doce', 3),
('Usinagem Premium', 'Industrial', 200000.00, '2023-08-10', 45000.00, 250000.00, '2024-11-01', '2024-11-03', 8000.00, 'CNC 5 eixos, Centro de usinagem', 'Aço inox, Titânio', 'Usinagem de alta precisão', 'Ferramentas de Corte', 'expansao', 'Metropolitana', 2)
ON CONFLICT DO NOTHING;

-- Inserir pedidos exemplo (vinculados a vendedores)
INSERT INTO pedidos (cliente_id, produto_id, vendedor_id, valor, data_pedido, status) VALUES
(1, 1, 1, 42500.00, '2024-10-20', 'concluido'),
(2, 2, 1, 21000.00, '2024-10-18', 'concluido'),
(4, 1, 3, 17000.00, '2024-09-22', 'concluido'),
(5, 4, 2, 96000.00, '2024-11-01', 'processando'),
(1, 2, 1, 8400.00, '2024-09-15', 'concluido'),
(2, 1, 1, 25500.00, '2024-09-10', 'concluido'),
(5, 1, 2, 51000.00, '2024-10-25', 'concluido'),
(4, 3, 3, 3600.00, '2024-08-30', 'concluido')
ON CONFLICT DO NOTHING;

-- Verificação
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT COUNT(*) as total_vendedores FROM vendedores;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT COUNT(*) as total_pedidos FROM pedidos;
```

---

## ✅ Após Executar o Script

Você deve ver:
- ✅ "Tabelas criadas com sucesso!"
- ✅ `total_vendedores`: 3
- ✅ `total_users`: 3
- ✅ `total_clientes`: 5
- ✅ `total_produtos`: 5
- ✅ `total_pedidos`: 8

---

## 🔐 IMPORTANTE: Criar Usuários no Supabase Auth

⚠️ **ATENÇÃO**: Os INSERTs acima criam registros na tabela `users`, mas **NÃO criam usuários no Supabase Auth**. Você precisa criar os usuários manualmente no Supabase Dashboard para poder fazer login.

### Como Criar Usuários de Teste:

1. Acesse seu projeto Supabase: https://obhdvwuszxcdgtinvtjg.supabase.co
2. Vá em **Authentication** → **Users** → **Add User**
3. Crie os seguintes usuários (use os mesmos UUIDs da tabela users):

**Usuário 1 - Admin:**
- Email: `joao@mgtools.com`
- Senha: `senha123`
- User UID: `00000000-0000-0000-0000-000000000001`
- Email Confirm: ✅ (marcar como confirmado)

**Usuário 2 - Vendedor:**
- Email: `carlos@mgtools.com`
- Senha: `senha123`
- User UID: `00000000-0000-0000-0000-000000000002`
- Email Confirm: ✅

**Usuário 3 - Vendedor:**
- Email: `maria@mgtools.com`
- Senha: `senha123`
- User UID: `00000000-0000-0000-0000-000000000003`
- Email Confirm: ✅

### Verificação:

Após criar os usuários no Supabase Auth, você pode testar o login:
1. Acesse http://localhost:5000/login
2. Use `joao@mgtools.com` / `senha123`
3. Deve redirecionar para o dashboard

## 🔐 Configuração de Permissões (Row Level Security)

**IMPORTANTE**: Por padrão, o Supabase ativa Row Level Security (RLS). Como estamos usando a `SERVICE_ROLE_KEY` no backend, as políticas RLS são **ignoradas** (acesso total). Isso é correto para este caso de uso.

Se você quiser adicionar RLS posteriormente para segurança extra, execute:

```sql
-- Desabilitar RLS temporariamente (já que usamos SERVICE_ROLE_KEY)
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Estrutura das Tabelas

### Tabela: `clientes`
Armazena informações completas dos clientes da MG Tools.

**Campos principais:**
- `id`: Identificador único
- `nome`: Nome do cliente
- `status`: ativo | inativo | contato | teste | expansao
- `regiao`: Região geográfica
- `potencial`: Potencial de vendas estimado (R$)
- `ultima_compra`: Data da última compra
- `maquinario`: Equipamentos que o cliente possui
- `familia_produtos`: Produtos de interesse

### Tabela: `produtos`
Catálogo de produtos da MG Tools.

**Campos principais:**
- `id`: Identificador único
- `nome`: Nome do produto
- `familia`: Família de produtos
- `categoria`: Premium | Standard | Economy
- `preco_base`: Preço base (R$)

### Tabela: `pedidos`
Histórico de pedidos/vendas.

**Campos principais:**
- `id`: Identificador único
- `cliente_id`: Referência ao cliente
- `produto_id`: Referência ao produto
- `valor`: Valor total do pedido (R$)
- `data_pedido`: Data do pedido
- `status`: pendente | processando | concluido | cancelado

---

## 🚀 Próximos Passos

Após executar o script:

1. ✅ Verifique se as tabelas foram criadas corretamente
2. ✅ Confirme que os dados de exemplo foram inseridos
3. ✅ Teste a aplicação NEXO - o Dashboard deve exibir os KPIs
4. ✅ Use o Chat NEXO para fazer perguntas sobre os clientes e produtos

---

## 🆘 Problemas Comuns

### Erro: "relation already exists"
**Solução**: As tabelas já existem. Você pode:
- Ignorar o erro (os dados não serão duplicados por causa do `ON CONFLICT DO NOTHING`)
- OU deletar as tabelas antes: `DROP TABLE IF EXISTS pedidos, clientes, produtos CASCADE;`

### Erro: "permission denied"
**Solução**: Certifique-se de:
- Estar usando o SQL Editor do Supabase com permissões de admin
- Ou use a `SERVICE_ROLE_KEY` que tem acesso total

### Dados de exemplo não foram inseridos
**Solução**: Execute apenas a seção de INSERT novamente.

---

## 📞 Suporte

Se precisar de ajuda adicional, consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [SQL Editor do Supabase](https://supabase.com/docs/guides/database/overview)
