-- ==========================================
-- SCRIPT: SINCRONIZAR USUÁRIOS SUPABASE AUTH → TABELA USERS
-- ==========================================
--
-- QUANDO USAR:
-- Depois de criar usuários no Supabase Auth Dashboard, execute este script
-- para sincronizar os UUIDs gerados com a tabela users do banco de dados.
--
-- PASSO A PASSO:
-- 1. Crie os usuários no Supabase Auth Dashboard (Authentication → Users → Add User)
-- 2. Copie o UUID gerado por cada usuário
-- 3. Cole os UUIDs abaixo nas linhas correspondentes
-- 4. Execute este script no SQL Editor
--
-- ==========================================

-- INSTRUÇÕES:
-- Substitua 'COLE_UUID_AQUI' pelos UUIDs reais do Supabase Auth

-- Usuário 1: João Silva (joao@mgtools.com)
UPDATE users 
SET id = 'COLE_UUID_JOAO_AQUI'
WHERE email = 'joao@mgtools.com';

-- Usuário 2: Carlos Souza (carlos@mgtools.com)
UPDATE users 
SET id = 'COLE_UUID_CARLOS_AQUI'
WHERE email = 'carlos@mgtools.com';

-- Usuário 3: Maria Santos (maria@mgtools.com)
UPDATE users 
SET id = 'COLE_UUID_MARIA_AQUI'
WHERE email = 'maria@mgtools.com';

-- Verificação: Ver os UUIDs atualizados
SELECT id, email, nome, role FROM users ORDER BY email;

-- ==========================================
-- EXEMPLO DE USO:
-- ==========================================
--
-- 1. Você criou João no Auth Dashboard e o Supabase gerou UUID: a1b2c3d4-1234-5678-9abc-def012345678
-- 2. Você substitui 'COLE_UUID_JOAO_AQUI' por 'a1b2c3d4-1234-5678-9abc-def012345678'
-- 3. Executa o script
-- 4. Agora pode fazer login com joao@mgtools.com / senha123
--
-- ==========================================
