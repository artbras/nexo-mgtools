import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare } from "lucide-react";

export default function Historico() {
  // Placeholder para histórico - será implementado com dados reais no backend
  const historicoPlaceholder = [
    {
      id: 1,
      titulo: "Análise de clientes inativos",
      data: new Date(Date.now() - 2 * 60 * 60 * 1000),
      tipo: "Clientes",
      resumo: "Identificados 8 clientes sem compras há mais de 60 dias",
    },
    {
      id: 2,
      titulo: "Relatório de vendas do mês",
      data: new Date(Date.now() - 24 * 60 * 60 * 1000),
      tipo: "Vendas",
      resumo: "Faturamento de R$ 420.000 com crescimento de 12%",
    },
    {
      id: 3,
      titulo: "Top produtos por família",
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tipo: "Produtos",
      resumo: "AHX-440 lidera com R$ 185.000 em vendas",
    },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Histórico de Análises</h1>
        <p className="text-muted-foreground">
          Consulte análises anteriores e re-execute quando necessário
        </p>
      </div>

      {/* Histórico Cards */}
      <div className="space-y-4">
        {historicoPlaceholder.map((item) => (
          <Card
            key={item.id}
            className="hover-elevate cursor-pointer transition-all"
            data-testid={`card-historico-${item.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1">{item.titulo}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {item.data.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {item.tipo}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.resumo}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {historicoPlaceholder.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Nenhuma análise no histórico
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Quando você realizar análises com o NEXO, elas aparecerão aqui para consulta futura.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
