import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, TrendingUp, Users, BarChart3, Trash2, Search, X } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@shared/schema";

const quickActions = [
  {
    icon: Users,
    label: "Clientes inativos 60+ dias",
    query: "Quais clientes estão há mais de 60 dias sem comprar?",
  },
  {
    icon: TrendingUp,
    label: "Vendas do mês",
    query: "Como foi o faturamento este mês?",
  },
  {
    icon: BarChart3,
    label: "Top produtos",
    query: "Quais são os produtos mais vendidos?",
  },
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar histórico de conversas do backend
  const { data: allMessages = [], isLoading: loadingHistory } = useQuery<ChatMessage[]>({
    queryKey: ["/api/agent/history"],
    refetchInterval: false, // Não fazer polling
  });

  // Filtrar mensagens baseado na busca
  const messages = useMemo(() => {
    if (!searchQuery.trim()) {
      return allMessages;
    }
    
    const query = searchQuery.toLowerCase();
    return allMessages.filter(message => 
      message.content.toLowerCase().includes(query)
    );
  }, [allMessages, searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest(
        "POST",
        "/api/agent/analyze",
        { query }
      );
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      // Recarregar histórico após nova análise
      queryClient.invalidateQueries({ queryKey: ["/api/agent/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao analisar",
        description: error.message || "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || analyzeMutation.isPending) return;

    analyzeMutation.mutate(input);
    setInput("");
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/agent/history");
    },
    onSuccess: () => {
      // Limpar cache local após deletar do backend
      queryClient.setQueryData(["/api/agent/history"], []);
      
      toast({
        title: "Conversa limpa",
        description: "O histórico foi limpo com sucesso. Você pode iniciar uma nova conversa.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao limpar conversa",
        description: error.message || "Não foi possível limpar o histórico.",
        variant: "destructive",
      });
    },
  });

  const handleClearChat = () => {
    clearChatMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card p-6 shrink-0">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Chat NEXO</h1>
                <p className="text-sm text-muted-foreground">
                  Seu analista comercial estratégico
                </p>
              </div>
            </div>
            
            {allMessages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={clearChatMutation.isPending}
                data-testid="button-clear-chat"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearChatMutation.isPending ? "Limpando..." : "Limpar conversa"}
              </Button>
            )}
          </div>

          {/* Search Bar */}
          {allMessages.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar no histórico de conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-search-history"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {/* Search Results Count */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              {messages.length === 0 ? (
                "Nenhuma mensagem encontrada"
              ) : (
                `${messages.length} ${messages.length === 1 ? "mensagem encontrada" : "mensagens encontradas"}`
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {loadingHistory ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-3/4" />
              <Skeleton className="h-20 w-2/3 ml-auto" />
              <Skeleton className="h-20 w-3/4" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Bem-vindo ao NEXO!
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Faça perguntas sobre clientes, produtos e oportunidades comerciais. 
                  Posso ajudar com análises, identificação de clientes inativos e muito mais.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {quickActions.map((action, idx) => (
                  <Card
                    key={idx}
                    className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => handleQuickAction(action.query)}
                    data-testid={`button-quick-action-${idx}`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <action.icon className="w-6 h-6 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {action.label}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${message.role}`}
              >
                <div
                  className={`max-w-3xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.role === "system"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-card border border-card-border"
                  } rounded-2xl p-6 shadow-sm`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  {message.data && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Dados disponíveis para análise
                      </p>
                    </div>
                  )}
                  <div className="mt-2 text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}

          {analyzeMutation.isPending && (
            <div className="flex justify-start" data-testid="loading-indicator">
              <div className="max-w-3xl bg-card border border-card-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
                  <span className="text-sm text-muted-foreground ml-2">
                    NEXO está analisando...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao NEXO sobre clientes, produtos ou oportunidades..."
              className="resize-none min-h-[60px]"
              disabled={analyzeMutation.isPending}
              data-testid="input-chat-message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || analyzeMutation.isPending}
              data-testid="button-send-message"
              className="h-[60px] w-[60px] shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
