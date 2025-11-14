import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Download, Calendar as CalendarIcon, TrendingUp, Users, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportTemplate = {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
};

type DashboardKPIs = {
  totalClientes: number;
  totalProdutos: number;
  pedidosMes: number;
  receitaMensal: number;
  variacao_clientes: number;
  variacao_pedidos: number;
  variacao_receita: number;
  topProdutos: Array<{ nome: string; total_vendas: number; total_receita: string }>;
  topClientes: Array<{ nome: string; total_pedidos: number; total_gasto: string }>;
};

const reportTemplates: ReportTemplate[] = [
  {
    id: "kpis",
    title: "Relatório de KPIs",
    description: "Visão geral dos principais indicadores de performance",
    icon: TrendingUp,
    category: "Executivo",
  },
  {
    id: "clientes",
    title: "Relatório de Clientes",
    description: "Análise detalhada de clientes ativos e inativos",
    icon: Users,
    category: "Comercial",
  },
  {
    id: "produtos",
    title: "Relatório de Produtos",
    description: "Performance de vendas por produto e família",
    icon: Package,
    category: "Comercial",
  },
];

export default function Relatorios() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("30d");
  const [customDataInicio, setCustomDataInicio] = useState<Date>();
  const [customDataFim, setCustomDataFim] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Buscar KPIs para o relatório
  const { data: kpis, isLoading: kpisLoading } = useQuery<DashboardKPIs>({
    queryKey: [
      "/api/dashboard/kpis",
      periodo,
      customDataInicio?.toISOString().split("T")[0],
      customDataFim?.toISOString().split("T")[0],
    ],
    enabled: !!selectedTemplate && (periodo !== "custom" || (!!customDataInicio && !!customDataFim)),
  });

  const generatePDF = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Erro",
        description: "Selecione um template",
        variant: "destructive",
      });
      return;
    }

    if (periodo === "custom" && (!customDataInicio || !customDataFim)) {
      toast({
        title: "Erro",
        description: "Selecione as datas de início e fim para período customizado",
        variant: "destructive",
      });
      return;
    }

    if (!kpis) {
      toast({
        title: "Erro",
        description: kpisLoading ? "Aguarde o carregamento dos dados" : "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const template = reportTemplates.find((t) => t.id === selectedTemplate);

      // Header do PDF
      doc.setFontSize(20);
      doc.setTextColor(255, 107, 53); // Orange MG Tools
      doc.text("MG Tools", 14, 20);

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(template?.title || "Relatório", 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 37);

      // Período selecionado
      let periodoText = "";
      if (periodo === "7d") periodoText = "Últimos 7 dias";
      else if (periodo === "30d") periodoText = "Últimos 30 dias";
      else if (periodo === "90d") periodoText = "Últimos 90 dias";
      else if (periodo === "1y") periodoText = "Último ano";
      else if (customDataInicio && customDataFim) {
        periodoText = `${format(customDataInicio, "dd/MM/yyyy")} - ${format(customDataFim, "dd/MM/yyyy")}`;
      }
      doc.text(`Período: ${periodoText}`, 14, 43);

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 47, 196, 47);

      // Conteúdo baseado no template
      if (selectedTemplate === "kpis") {
        // KPIs principais
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Indicadores Principais", 14, 55);

        const kpisData = [
          ["Indicador", "Valor Atual", "Variação"],
          ["Total de Clientes", kpis.totalClientes?.toString() || "0", kpis.variacao_clientes != null ? `${kpis.variacao_clientes >= 0 ? "+" : ""}${kpis.variacao_clientes}%` : "-"],
          ["Total de Produtos", kpis.totalProdutos?.toString() || "0", "-"],
          ["Pedidos no Período", kpis.pedidosMes?.toString() || "0", kpis.variacao_pedidos != null ? `${kpis.variacao_pedidos >= 0 ? "+" : ""}${kpis.variacao_pedidos}%` : "-"],
          ["Receita Total", `R$ ${(kpis.receitaMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, kpis.variacao_receita != null ? `${kpis.variacao_receita >= 0 ? "+" : ""}${kpis.variacao_receita}%` : "-"],
        ];

        autoTable(doc, {
          startY: 60,
          head: [kpisData[0]],
          body: kpisData.slice(1),
          theme: "grid",
          headStyles: { fillColor: [255, 107, 53] },
          styles: { fontSize: 10 },
        });

        // Top Produtos
        if (kpis.topProdutos && kpis.topProdutos.length > 0) {
          doc.setFontSize(14);
          doc.text("Top 5 Produtos Mais Vendidos", 14, (doc as any).lastAutoTable.finalY + 15);

          const produtosData = [
            ["Produto", "Quantidade", "Receita"],
            ...kpis.topProdutos.map((p: any) => [
              p.nome || "Sem nome",
              (p.total_vendas || 0).toString(),
              `R$ ${(parseFloat(p.total_receita) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            ]),
          ];

          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [produtosData[0]],
            body: produtosData.slice(1),
            theme: "grid",
            headStyles: { fillColor: [255, 107, 53] },
            styles: { fontSize: 10 },
          });
        }

        // Top Clientes
        if (kpis.topClientes && kpis.topClientes.length > 0) {
          doc.setFontSize(14);
          doc.text("Top 5 Clientes", 14, (doc as any).lastAutoTable.finalY + 15);

          const clientesData = [
            ["Cliente", "Pedidos", "Receita"],
            ...kpis.topClientes.map((c: any) => [
              c.nome || "Sem nome",
              (c.total_pedidos || 0).toString(),
              `R$ ${(parseFloat(c.total_gasto) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            ]),
          ];

          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [clientesData[0]],
            body: clientesData.slice(1),
            theme: "grid",
            headStyles: { fillColor: [255, 107, 53] },
            styles: { fontSize: 10 },
          });
        }
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Download do PDF
      const fileName = `nexo-${selectedTemplate}-${format(new Date(), "yyyy-MM-dd-HHmmss")}.pdf`;
      doc.save(fileName);

      toast({
        title: "Relatório gerado!",
        description: `O arquivo ${fileName} foi baixado com sucesso.`,
      });
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Gere relatórios personalizados em PDF com dados do período selecionado
          </p>
        </div>

        {/* Templates */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Templates de Relatórios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer hover-elevate active-elevate-2 transition-all ${
                  selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
                data-testid={`card-template-${template.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <template.icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardTitle className="mt-4">{template.title}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Configurações do Relatório */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Relatório</CardTitle>
              <CardDescription>Selecione o período e gere o PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtro de Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="1y">Último ano</SelectItem>
                    <SelectItem value="custom">Período customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Pickers para período customizado */}
              {periodo === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-date-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDataInicio ? (
                            format(customDataInicio, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customDataInicio}
                          onSelect={setCustomDataInicio}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-date-end"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDataFim ? (
                            format(customDataFim, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customDataFim}
                          onSelect={setCustomDataFim}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Botão Gerar PDF */}
              <div className="pt-4">
                <Button
                  onClick={generatePDF}
                  disabled={isGenerating || kpisLoading || (periodo === "custom" && (!customDataInicio || !customDataFim))}
                  className="w-full"
                  data-testid="button-generate-pdf"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGenerating ? "Gerando PDF..." : kpisLoading ? "Carregando dados..." : "Gerar Relatório PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
