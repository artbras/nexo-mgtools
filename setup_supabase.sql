-- ==========================================
-- SCRIPT SQL - AGENTE NEXO MG TOOLS
-- Database: Supabase PostgreSQL
-- ATENÇÃO: Este script REMOVE todas as tabelas existentes e recria do zero
-- ==========================================

-- PASSO 1: REMOVER TABELAS EXISTENTES (se houver)
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vendedores CASCADE;

-- PASSO 2: CRIAR TABELAS NA ORDEM CORRETA

-- Tabela 1: vendedores (deve ser criada PRIMEIRO pois outras dependem dela)
CREATE TABLE vendedores (
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

-- Tabela 2: users (referencia vendedores)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'vendedor', 'gerente')),
  vendedor_id INTEGER REFERENCES vendedores(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela 3: clientes (referencia vendedores)
CREATE TABLE clientes (
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

-- Tabela 4: produtos (independente)
CREATE TABLE produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  familia VARCHAR(100),
  categoria VARCHAR(100),
  descricao TEXT,
  preco_base DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela 5: pedidos (referencia clientes, produtos e vendedores)
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  vendedor_id INTEGER REFERENCES vendedores(id),
  valor DECIMAL(10,2) NOT NULL,
  data_pedido DATE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pendente', 'processando', 'concluido', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela 6: chat_history (independente)
CREATE TABLE chat_history (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PASSO 3: CRIAR ÍNDICES PARA PERFORMANCE

CREATE INDEX idx_vendedores_status ON vendedores(status);
CREATE INDEX idx_vendedores_regiao ON vendedores(regiao_atuacao);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_regiao ON clientes(regiao);
CREATE INDEX idx_clientes_ultima_compra ON clientes(ultima_compra);
CREATE INDEX idx_clientes_grupo ON clientes(grupo);
CREATE INDEX idx_pedidos_vendedor ON pedidos(vendedor_id);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_produtos_familia ON produtos(familia);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);

-- PASSO 4: CRIAR FUNÇÃO E TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendedores_updated_at
BEFORE UPDATE ON vendedores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PASSO 5: INSERIR DADOS DE EXEMPLO

-- Vendedores
INSERT INTO vendedores (nome, email, telefone, regiao_atuacao, meta_mensal, comissao_percentual, status, data_contratacao) VALUES
('João Silva', 'joao@mgtools.com', '31 98765-4321', 'Zona da Mata', 200000.00, 5.00, 'ativo', '2023-01-10'),
('Maria Santos', 'maria@mgtools.com', '31 98765-4322', 'Metropolitana', 250000.00, 5.50, 'ativo', '2023-03-15'),
('Carlos Souza', 'carlos@mgtools.com', '31 98765-4323', 'Vale do Rio Doce', 180000.00, 4.50, 'ativo', '2023-06-20');

-- Users
-- IMPORTANTE: Os UUIDs abaixo são TEMPORÁRIOS!
-- Você precisará atualizar com os UUIDs reais do Supabase Auth depois.
-- Siga as instruções no arquivo INSTRUCOES_SETUP.md
INSERT INTO users (id, email, nome, role, vendedor_id) VALUES
('00000000-0000-0000-0000-000000000001', 'joao@mgtools.com', 'João Silva', 'vendedor', 1),
('00000000-0000-0000-0000-000000000002', 'carlos@mgtools.com', 'Carlos Souza', 'vendedor', 3),
('00000000-0000-0000-0000-000000000003', 'maria@mgtools.com', 'Maria Santos', 'vendedor', 2);

-- Produtos
INSERT INTO produtos (nome, familia, categoria, descricao, preco_base) VALUES
('AHX-440', 'Ferramentas de Corte', 'Premium', 'Ferramenta de alta precisão para usinagem CNC', 850.00),
('MH-250', 'Ferramentas de Corte', 'Standard', 'Ferramenta padrão para fresamento', 420.00),
('Standard Line', 'Ferramentas Básicas', 'Economy', 'Linha econômica para operações básicas', 180.00),
('Pro-Cut 500', 'Ferramentas de Corte', 'Premium', 'Sistema profissional de corte', 1200.00),
('Basic Tool Kit', 'Ferramentas Básicas', 'Economy', 'Kit básico de ferramentas', 95.00);

-- Clientes
INSERT INTO clientes (nome, grupo, potencial, entrada_pedidos, orcamento_aberto, meta, ultima_compra, ultima_visita, valor_testes, maquinario, material_usinado, tipo_servico, familia_produtos, status, regiao, vendedor_id) VALUES
('Metalúrgica Pimenta', 'Industrial', 150000.00, '2024-01-15', 25000.00, 180000.00, '2024-10-20', '2024-11-01', 5000.00, 'CNC 4 eixos, Fresadora vertical', 'Aço inox, Alumínio', 'Usinagem de precisão', 'Ferramentas de Corte', 'ativo', 'Zona da Mata', 1),
('Poçostec Usinagem', 'Industrial', 120000.00, '2024-02-10', 18000.00, 140000.00, '2024-10-18', '2024-10-25', 3000.00, 'Fresadora vertical, Torno CNC', 'Aço carbono, Alumínio', 'Usinagem geral', 'Ferramentas de Corte', 'ativo', 'Zona da Mata', 1),
('Usinagem Central', 'Industrial', 90000.00, '2023-11-20', 0.00, 100000.00, '2024-08-15', '2024-06-10', 0.00, 'Torno convencional', 'Aço carbono', 'Usinagem básica', 'Ferramentas Básicas', 'inativo', 'Metropolitana', 2),
('Metalúrgica do Vale', 'Industrial', 75000.00, '2024-03-05', 12000.00, 85000.00, '2024-09-22', '2024-10-15', 2000.00, 'CNC 3 eixos', 'Alumínio, Bronze', 'Usinagem de precisão', 'Ferramentas de Corte', 'ativo', 'Vale do Rio Doce', 3),
('Usinagem Premium', 'Industrial', 200000.00, '2023-08-10', 45000.00, 250000.00, '2024-11-01', '2024-11-03', 8000.00, 'CNC 5 eixos, Centro de usinagem', 'Aço inox, Titânio', 'Usinagem de alta precisão', 'Ferramentas de Corte', 'expansao', 'Metropolitana', 2);

-- Pedidos
INSERT INTO pedidos (cliente_id, produto_id, vendedor_id, valor, data_pedido, status) VALUES
(1, 1, 1, 42500.00, '2024-10-20', 'concluido'),
(2, 2, 1, 21000.00, '2024-10-18', 'concluido'),
(4, 1, 3, 17000.00, '2024-09-22', 'concluido'),
(5, 4, 2, 96000.00, '2024-11-01', 'processando'),
(1, 2, 1, 8400.00, '2024-09-15', 'concluido'),
(2, 1, 1, 25500.00, '2024-09-10', 'concluido'),
(5, 1, 2, 51000.00, '2024-10-25', 'concluido'),
(4, 3, 3, 3600.00, '2024-08-30', 'concluido');

-- PASSO 6: DESATIVAR ROW LEVEL SECURITY (RLS)
-- IMPORTANTE: RLS bloqueia queries do backend mesmo com service_role_key
-- Por isso desativamos para permitir acesso completo do backend

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history DISABLE ROW LEVEL SECURITY;

-- PASSO 7: VERIFICAÇÃO

SELECT 'Setup concluído com sucesso!' as status;
SELECT COUNT(*) as total_vendedores FROM vendedores;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT COUNT(*) as total_pedidos FROM pedidos;

-- Verificar se RLS foi desativado (deve retornar 'false' para todas)
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'vendedores', 'clientes', 'produtos', 'pedidos', 'chat_history')
ORDER BY tablename;
