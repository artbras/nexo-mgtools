# NEXO - Agente Comercial Inteligente MG Tools

## Overview

NEXO is an AI-powered commercial intelligence agent designed for MG Tools, a B2B company. Its primary purpose is to provide strategic sales analysis, client relationship management, and data-driven insights. It achieves this through a conversational AI interface, powered by OpenAI's GPT-4o-mini, integrated with executive dashboards. The system helps sales teams identify opportunities, manage client relationships, and make informed decisions by analyzing data from clients, products, orders, and sales representatives.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18+ and TypeScript, using Vite for development and bundling. Wouter handles client-side routing, and TanStack React Query manages server state. The UI utilizes Shadcn/ui (based on Radix UI primitives) and Tailwind CSS for styling, adhering to a hybrid design system inspired by Linear, Stripe, and ChatGPT. It supports light/dark modes, features a responsive sidebar, KPI cards, Recharts visualizations, and a chat interface with message history and quick actions.

### Backend Architecture

The backend is developed with Express.js and TypeScript, serving RESTful APIs under the `/api` namespace. It includes authentication routes handled by Supabase, protected routes for AI analysis, dashboard KPIs, chat history, and sales representative data, and administrative routes with `requireAdmin` middleware for user and sales representative management. The AI integration uses OpenAI Function Calling to process natural language queries and map them to Supabase data, providing structured and prioritized insights.

### Database Architecture

Supabase (PostgreSQL) is the primary data store, accessed via `@supabase/supabase-js`. The schema includes `Clientes`, `Produtos`, `Pedidos`, and `Chat_History` tables. `Clientes` stores detailed client information, `Produtos` for product details, `Pedidos` for transaction data linking clients and products, and `Chat_History` for conversation persistence. Drizzle ORM is used for schema definition and type generation, ensuring type safety across the stack.

### Type System

A shared schema, defined using Drizzle ORM and validated with Zod, ensures type safety across the frontend and backend. This shared schema is exported as TypeScript types, facilitating consistent data structures and validation.

## External Dependencies

### Third-Party Services

*   **Supabase:** Used for all persistent data storage (clients, products, orders, chat history) and authentication.
*   **OpenAI API:** GPT-4o-mini model used for natural language processing, query understanding, and response generation, integrated via function calling.
*   **Google Fonts:** Inter, JetBrains Mono, and Poppins fonts are loaded for typography.

### Key NPM Packages

*   **Database & ORM:** `@supabase/supabase-js`, `drizzle-orm`
*   **AI Integration:** `openai`
*   **Backend:** `express`, `express-session`, `connect-pg-simple`, `passport`
*   **Frontend:** `react`, `react-dom`, `@tanstack/react-query`, `wouter`, `recharts`, `jspdf`, `jspdf-autotable`, `tailwindcss`, `@radix-ui/*`
*   **Utilities:** `zod`, `date-fns`

### Environment Variables Required

*   `DATABASE_URL`
*   `SUPABASE_URL`
*   `SUPABASE_SERVICE_ROLE_KEY`
*   `OPENAI_API_KEY`
*   `SESSION_SECRET`
*   `NODE_ENV`

### Deployment Platform

*   **Replit:** Used as the full-stack hosting environment.