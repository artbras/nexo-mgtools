import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, decimal, date, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabela: vendedores
export const vendedores = pgTable("vendedores", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  telefone: varchar("telefone", { length: 50 }),
  regiao_atuacao: varchar("regiao_atuacao", { length: 100 }),
  meta_mensal: decimal("meta_mensal", { precision: 10, scale: 2 }),
  comissao_percentual: decimal("comissao_percentual", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 50 }),
  data_contratacao: date("data_contratacao"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela: users (vinculada ao Supabase Auth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // UUID do Supabase Auth
  email: varchar("email", { length: 255 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'admin', 'vendedor', 'gerente'
  vendedor_id: integer("vendedor_id").references(() => vendedores.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela: clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  grupo: varchar("grupo", { length: 100 }),
  potencial: decimal("potencial", { precision: 10, scale: 2 }),
  entrada_pedidos: date("entrada_pedidos"),
  orcamento_aberto: decimal("orcamento_aberto", { precision: 10, scale: 2 }).default(sql`0`),
  meta: decimal("meta", { precision: 10, scale: 2 }),
  ultima_compra: date("ultima_compra"),
  ultima_visita: date("ultima_visita"),
  valor_testes: decimal("valor_testes", { precision: 10, scale: 2 }).default(sql`0`),
  maquinario: varchar("maquinario", { length: 255 }),
  material_usinado: varchar("material_usinado", { length: 255 }),
  tipo_servico: varchar("tipo_servico", { length: 255 }),
  familia_produtos: varchar("familia_produtos", { length: 255 }),
  status: varchar("status", { length: 50 }),
  regiao: varchar("regiao", { length: 100 }),
  vendedor_id: integer("vendedor_id").references(() => vendedores.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela: produtos
export const produtos = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  familia: varchar("familia", { length: 100 }),
  categoria: varchar("categoria", { length: 100 }),
  descricao: text("descricao"),
  preco_base: decimal("preco_base", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela: pedidos
export const pedidos = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  cliente_id: integer("cliente_id").references(() => clientes.id, { onDelete: 'cascade' }),
  produto_id: integer("produto_id").references(() => produtos.id, { onDelete: 'set null' }),
  vendedor_id: integer("vendedor_id").references(() => vendedores.id),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  data_pedido: date("data_pedido").notNull(),
  status: varchar("status", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Schemas de inserção
export const insertVendedorSchema = createInsertSchema(vendedores).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  created_at: true,
  updated_at: true,
});

export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProdutoSchema = createInsertSchema(produtos).omit({
  id: true,
  created_at: true,
});

export const insertPedidoSchema = createInsertSchema(pedidos).omit({
  id: true,
  created_at: true,
});

// Tipos TypeScript
export type Vendedor = typeof vendedores.$inferSelect;
export type InsertVendedor = z.infer<typeof insertVendedorSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;

export type Produto = typeof produtos.$inferSelect;
export type InsertProduto = z.infer<typeof insertProdutoSchema>;

export type Pedido = typeof pedidos.$inferSelect;
export type InsertPedido = z.infer<typeof insertPedidoSchema>;

// Tabela: chat_history (para persistência de conversas)
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  data: text("data"), // JSON stringificado
  created_at: timestamp("created_at").defaultNow(),
});

export const insertChatHistorySchema = createInsertSchema(chatHistory).omit({
  id: true,
  created_at: true,
});

export type ChatHistoryRecord = typeof chatHistory.$inferSelect;
export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;

// Tipos para análises e chat
export type ChatMessage = {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
};

export type DashboardKPIs = {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  cotacoesAbertas: number;
  receitaMensal: number;
  receitaAnterior: number;
  topProdutos: Array<{
    nome: string;
    valor: number;
    percentual: number;
  }>;
  topClientes: Array<{
    nome: string;
    valor: number;
  }>;
};

export type ClienteAnalise = Cliente & {
  dias_sem_compra?: number;
  prioridade?: 'alto' | 'medio' | 'baixo';
  tendencia?: 'crescente' | 'estavel' | 'decrescente';
};

export type AnalisePeriodo = {
  periodo: string;
  faturamento_total: number;
  variacao_percentual: number;
  top_produtos: Array<{
    nome: string;
    valor: number;
    variacao: number;
  }>;
  top_clientes: Array<{
    nome: string;
    valor: number;
  }>;
};
