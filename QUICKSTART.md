# 🚀 Início Rápido - NEXO MG Tools

**Tempo estimado: 5 minutos**

---

## ✅ Pré-requisito: Banco de Dados

Antes de usar o NEXO, você DEVE executar o script SQL no Supabase.

### Passo 1: Acessar Supabase SQL Editor

1. Vá para: https://obhdvwuszxcdgtinvtjg.supabase.co
2. No menu lateral, clique em **SQL Editor**
3. Clique em **+ New Query**

### Passo 2: Executar Script SQL

1. Abra o arquivo `DATABASE_SETUP.md` neste projeto
2. **Copie TODO o conteúdo** do script SQL (começa com `-- ======`)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar Resultado

Você deve ver no output:

```
✅ Tabelas criadas com sucesso!
total_clientes: 5
total_produtos: 5
total_pedidos: 8
```

**✨ Pronto!** Seu banco está configurado.

---

## 🎯 Usando o NEXO

A aplicação já está rodando. Acesse a URL fornecida pelo Replit.

### 1️⃣ Dashboard

**Página inicial** - Visualize KPIs em tempo real:

- 📊 Total de clientes: 5
- ⚠️ Clientes inativos: Identifique riscos
- 💰 Cotações abertas: Acompanhe oportunidades
- 📈 Receita mensal: Compare com mês anterior
- **Gráficos**: Top 5 Produtos e Top 5 Clientes

**Dica**: Se os valores estiverem zerados, você esqueceu de executar o script SQL!

### 2️⃣ Chat com NEXO

**Pergunte qualquer coisa** sobre seus clientes, produtos e vendas em português:

**Exemplos de perguntas:**

```
✨ Quais clientes estão há mais de 60 dias sem comprar?
✨ Qual o potencial de vendas da Metalúrgica Pimenta?
✨ Quais são os 5 produtos mais vendidos este mês?
✨ Me mostre todos os clientes da Zona da Mata
✨ Quais clientes têm potencial para comprar AHX-440?
```

**NEXO responde com:**
- 🔴 **Prioridade Alta**: Ações urgentes
- 🟡 **Prioridade Média**: Atenção necessária
- 🟢 **Prioridade Baixa**: Monitoramento

**Ou use Quick Actions:**
- Clique em um dos botões laranja para perguntas pré-definidas
- Query aparece automaticamente no campo de texto
- Clique em **Enviar** e aguarde a resposta

**⏱️ Primeira pergunta pode demorar 10-15s** (OpenAI cold start)

### 3️⃣ Histórico

**Veja análises anteriores** - Todas as conversas são salvas automaticamente.

---

## 🎨 Personalização

### Dark Mode

Clique no ícone de **sol/lua** no canto superior direito para alternar entre temas claro e escuro.

### Cores MG Tools

- **Laranja (#FF6B35)**: Ações principais, CTAs, destaques
- **Azul (#2C3E50)**: Informação, confiança, dados

---

## 🆘 Problemas Comuns

### Dashboard mostra valores zerados

**Causa**: Você não executou o script SQL do DATABASE_SETUP.md

**Solução**: Volte para "Pré-requisito: Banco de Dados" acima

---

### Chat retorna erro 500

**Possíveis causas:**

1. **Tabela `chat_history` não existe**
   - Execute o script SQL completo do DATABASE_SETUP.md

2. **OPENAI_API_KEY inválida**
   - Verifique se a chave está correta em Settings → Secrets
   - Teste em: https://platform.openai.com/api-keys

3. **SUPABASE_SERVICE_ROLE_KEY incorreta**
   - Vá em Supabase → Settings → API
   - Copie a `service_role` key (não a `anon` key!)

---

### Gráficos não aparecem

**Causa**: Poucos dados no banco

**Solução**: Os dados de exemplo já incluem 5 produtos e 5 clientes. Se ainda assim não aparecer:
- Verifique o console do navegador (F12 → Console)
- Procure por erros de API

---

### "Não consigo ver a aplicação"

**Solução**:
1. Verifique se o workflow "Start application" está RUNNING (verde)
2. Acesse a URL fornecida pelo Replit (geralmente termina em `.replit.dev`)
3. Se não funcionar, clique em **Stop** e **Run** novamente

---

## 📚 Documentação Completa

- **README.md** - Visão geral completa do projeto
- **DATABASE_SETUP.md** - Script SQL detalhado com explicações
- **design_guidelines.md** - Design system e diretrizes de UI

---

## 💡 Dicas para Aproveitar ao Máximo

### Perguntas Estratégicas

O NEXO foi treinado para dar insights **acionáveis**. Faça perguntas estratégicas:

❌ **Ruim**: "Liste todos os clientes"
✅ **Bom**: "Quais clientes têm alto potencial mas estão inativos?"

❌ **Ruim**: "Mostre os produtos"
✅ **Bom**: "Quais produtos têm margem crescente este mês?"

### Filtragem Avançada

Use critérios específicos:

```
Clientes da Metropolitana com orçamento aberto acima de R$ 20.000
Produtos da família "Ferramentas de Corte" com vendas em queda
Clientes há mais de 90 dias sem compra que têm CNC 5 eixos
```

### Acompanhamento

O NEXO mantém contexto da conversa. Você pode fazer follow-ups:

```
Usuário: Quais clientes estão inativos?
NEXO: [responde com 3 clientes]

Usuário: Qual o potencial do primeiro cliente?
NEXO: [analisa o primeiro cliente da lista anterior]
```

---

## 🚀 Próximos Passos

Agora que você configurou o NEXO:

1. ✅ **Explore o Dashboard** - Familiarize-se com os KPIs
2. ✅ **Teste o Chat** - Faça algumas perguntas sobre seus dados
3. ✅ **Experimente Dark Mode** - Veja qual tema você prefere
4. ✅ **Analise o Histórico** - Veja como as conversas são salvas

---

**Desenvolvido com ❤️ para MG Tools**

Dúvidas? Consulte o README.md completo ou a documentação do Supabase/OpenAI.
