# 🚀 NEXO - Agente Comercial Inteligente

![NEXO Banner](https://img.shields.io/badge/NEXO-MG%20Tools-FF6B35?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

Sistema de inteligência comercial baseado em IA para análise estratégica de vendas, gestão de clientes e insights orientados por dados.

---

## 📋 Sobre o Projeto

**NEXO** é um agente comercial inteligente desenvolvido para a **MG Tools**, empresa B2B especializada em ferramentas de corte. O sistema utiliza IA (GPT-4o-mini) para fornecer:

- 🤖 **Chat Inteligente**: Análise de dados em linguagem natural
- 📊 **Dashboard Executivo**: KPIs em tempo real e visualizações
- 📄 **Relatórios em PDF**: Geração automática de relatórios profissionais
- 👥 **Módulo Admin**: Gestão de usuários e vendedores com controle de acesso baseado em roles

---

## 🎯 Funcionalidades Principais

### 🤖 1. Chat Inteligente com IA
- Interface conversacional com OpenAI GPT-4o-mini
- Análise de dados em linguagem natural
- Histórico de conversas com busca integrada
- Ações rápidas predefinidas
- Função de limpar conversa
- Function Calling para queries estruturadas

### 📊 2. Dashboard Executivo
- **KPIs em tempo real:**
  - Total de clientes ativos
  - Valor total de pedidos
  - Ticket médio
  - Taxa de crescimento
- **Visualizações gráficas:**
  - Vendas mensais (gráfico de barras)
  - Top 10 clientes (gráfico de barras horizontal)
  - Distribuição por categoria (gráfico de pizza)
- **Filtros de período:** 7d, 30d, 90d, 1 ano, customizado

### 📄 3. Módulo de Relatórios
- **Geração de PDFs profissionais** com logo MG Tools
- **3 Templates:**
  1. Relatório de KPIs
  2. Relatório de Clientes
  3. Relatório de Produtos
- Filtros de período personalizáveis
- Formatação automática em Real (BRL)
- Estados de loading

### 👥 4. Módulo Administrativo
- **Gestão de Usuários:**
  - Listar todos os usuários
  - Criar novos usuários
  - Visualizar estatísticas
- **Gestão de Vendedores:**
  - Cadastro completo
  - Análise de performance
- **Controle de Acesso (RBAC):**
  - Proteção frontend com alertas
  - Middleware backend `requireAdmin`
  - Segurança em rotas administrativas

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18+** com TypeScript
- **Vite** - Build e desenvolvimento
- **Wouter** - Roteamento client-side
- **TanStack React Query** - Gerenciamento de estado
- **Shadcn/ui** + **Radix UI** - Componentes
- **Tailwind CSS** - Estilização
- **Recharts** - Visualizações
- **jsPDF** + **jsPDF-AutoTable** - Geração de PDFs
- **Lucide React** - Ícones

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **Supabase** (PostgreSQL + Auth)
- **OpenAI API** (GPT-4o-mini)
- **Drizzle ORM** - Tipagem
- **Zod** - Validação
- **Express Session** - Sessões

### Banco de Dados
- **Supabase PostgreSQL**
- **Tabelas:** `users`, `Clientes`, `Produtos`, `Pedidos`, `Chat_History`

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Conta Supabase
- API Key OpenAI

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# OpenAI
OPENAI_API_KEY=sua_api_key_openai

# Session
SESSION_SECRET=sua_chave_secreta_aleatoria

# Environment
NODE_ENV=development
```

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

### Configuração do Banco de Dados

Execute as migrations do Supabase para criar as tabelas necessárias:
- `users` - Usuários do sistema
- `Clientes` - Informações de clientes
- `Produtos` - Catálogo de produtos
- `Pedidos` - Histórico de transações
- `Chat_History` - Histórico de conversas

---

## 📊 Estrutura do Projeto

```
nexo/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── ui/          # Componentes Shadcn
│   │   │   └── app-sidebar.tsx
│   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── dashboard.tsx
│   │   │   ├── chat.tsx
│   │   │   ├── relatorios.tsx
│   │   │   └── admin.tsx
│   │   ├── lib/             # Utilitários
│   │   └── App.tsx          # Componente raiz
│   └── index.html
│
├── server/                   # Backend Express
│   ├── routes.ts            # Definição de rotas API
│   ├── services/            # Lógica de negócio
│   │   ├── auth.ts         # Autenticação
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── openai.ts       # Integração OpenAI
│   └── index.ts            # Entry point
│
├── shared/                  # Código compartilhado
│   └── schema.ts           # Schemas Drizzle + Zod
│
└── package.json
```

---

## 🎨 Design e Branding

### Cores MG Tools
- **Laranja Principal:** `#FF6B35`
- **Azul Escuro:** `#2C3E50`
- **Cinza Claro:** `#F4F4F4`

### Tipografia
- **Principal:** Inter (Google Fonts)
- **Monospace:** JetBrains Mono
- **Títulos:** Poppins

### Temas
- Suporte completo a modo claro e escuro
- Sistema de design híbrido inspirado em Linear, Stripe e ChatGPT

---

## 🔒 Segurança

### Controle de Acesso
- **Frontend:** Verificação de role com alerts de acesso negado
- **Backend:** Middleware `requireAdmin` em todas as rotas administrativas
- **Endpoints protegidos:**
  - `POST /api/admin/users`
  - `GET /api/admin/users`
  - `POST /api/vendedores`

### Boas Práticas
- Validação de dados com Zod
- Sanitização de inputs
- Proteção contra SQL Injection (via Drizzle ORM)
- Sessões seguras com cookies HTTP-only
- Autenticação via Supabase Auth

---

## 📊 Funcionalidades de Análise de Dados

### Function Calling (OpenAI)
O sistema utiliza OpenAI Function Calling para:
1. Processar consultas em linguagem natural
2. Mapear intenções para queries SQL
3. Executar análises no banco Supabase
4. Retornar insights estruturados e priorizados

### Tipos de Análises Suportadas
- Análise de performance de clientes
- Identificação de oportunidades de vendas
- Tendências de produtos
- Performance de vendedores
- Análises customizadas via chat

---

## 🌐 Deployment

### Domínio Customizado
- **Produção:** `mgtools.ab.rio.br`

### Plataforma
- **Replit** (ambiente full-stack)

### Build para Produção
```bash
# Build otimizado
npm run build

# Variável de ambiente
NODE_ENV=production
```

---

## 📝 Licença

Propriedade de **MG Tools**. Todos os direitos reservados.

---

## 👥 Contato

Para questões sobre o sistema NEXO, entre em contato com a equipe de desenvolvimento da MG Tools.

---

**Desenvolvido com ❤️ para MG Tools**
