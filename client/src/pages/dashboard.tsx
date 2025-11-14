import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, UserX, FileText, TrendingUp, Package, DollarSign, UserCheck, Calendar as CalendarIcon, Download, TrendingUpIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DashboardKPIs } from "@shared/schema";

interface VendasPorVendedor {
  vendedor: string;
  vendas: number;
}

interface EvolucaoReceita {
  data: string;
  receita: number;
}

type PeriodoPreset = "7d" | "30d" | "90d" | "1y" | "custom";

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<PeriodoPreset>("30d");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  // Calcular parâmetros de query com base no período selecionado
  const getQueryParams = () => {
    if (periodo === "custom" && dataInicio && dataFim) {
      return `?dataInicio=${format(dataInicio, "yyyy-MM-dd")}&dataFim=${format(dataFim, "yyyy-MM-dd")}`;
    }
    return `?periodo=${periodo}`;
  };

  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis", periodo, dataInicio, dataFim],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/kpis${getQueryParams()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao carregar KPIs');
      return response.json();
    },
  });

  const { data: vendasPorVendedor, isLoading: isLoadingVendas } = useQuery<VendasPorVendedor[]>({
    queryKey: ["/api/dashboard/vendas-por-vendedor", periodo, dataInicio, dataFim],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/vendas-por-vendedor${getQueryParams()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao carregar vendas');
      return response.json();
    },
  });

  const { data: evolucaoReceita, isLoading: isLoadingEvolucao } = useQuery<EvolucaoReceita[]>({
    queryKey: ["/api/dashboard/evolucao-receita", periodo, dataInicio, dataFim],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/evolucao-receita${getQueryParams()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao carregar evolução');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 lg:p-12 space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const variacaoPercentual = kpis?.receitaAnterior
    ? ((kpis.receitaMensal - kpis.receitaAnterior) / kpis.receitaAnterior) * 100
    : 0;

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  // Função para exportar dados em CSV
  const handleExportCSV = () => {
    if (!kpis) return;

    const csvData = [
      ['Métrica', 'Valor'],
      ['Total de Clientes', kpis.totalClientes],
      ['Clientes Ativos', kpis.clientesAtivos],
      ['Clientes Inativos', kpis.clientesInativos],
      ['Cotações Abertas', `R$ ${kpis.cotacoesAbertas.toFixed(2)}`],
      ['Receita Mensal', `R$ ${kpis.receitaMensal.toFixed(2)}`],
      ['Receita Mês Anterior', `R$ ${kpis.receitaAnterior.toFixed(2)}`],
      [''],
      ['Top Produtos', ''],
      ['Produto', 'Valor'],
      ...kpis.topProdutos.map(p => [p.nome, `R$ ${p.valor.toFixed(2)}`]),
      [''],
      ['Top Clientes', ''],
      ['Cliente', 'Valor'],
      ...kpis.topClientes.map(c => [c.nome, `R$ ${c.valor.toFixed(2)}`]),
    ];

    const csvContent = csvData.map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              Visão geral de clientes, produtos e desempenho comercial
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!kpis}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros de Período */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground shrink-0">
            Período:
          </label>
          
          <Select value={periodo} onValueChange={(v: PeriodoPreset) => setPeriodo(v)}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-periodo">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodo === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-[180px]"
                    data-testid="button-data-inicio"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-[180px]"
                    data-testid="button-data-fim"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-elevate" data-testid="card-total-clientes">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {kpis?.totalClientes || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis?.clientesAtivos || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-clientes-inativos">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Inativos
            </CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-destructive">
              {kpis?.clientesInativos || 0}
            </div>
            <p className="text-xs text-destructive mt-1">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-cotacoes-abertas">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cotações Abertas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {kpis?.cotacoesAbertas ? `R$ ${(kpis.cotacoesAbertas / 1000).toFixed(0)}k` : "R$ 0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em negociação
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-receita-mensal">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${variacaoPercentual >= 0 ? 'text-chart-3' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              {kpis?.receitaMensal ? `R$ ${(kpis.receitaMensal / 1000).toFixed(0)}k` : "R$ 0"}
            </div>
            <p className={`text-xs mt-1 ${variacaoPercentual >= 0 ? 'text-chart-3' : 'text-destructive'}`}>
              {variacaoPercentual >= 0 ? '↑' : '↓'} {Math.abs(variacaoPercentual).toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpis?.topProdutos && kpis.topProdutos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpis.topProdutos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="nome"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpis?.topClientes && kpis.topClientes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={kpis.topClientes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.nome}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="valor"
                  >
                    {kpis.topClientes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal de Receita */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-chart-3" />
            Evolução de Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEvolucao ? (
            <Skeleton className="h-[300px] w-full" />
          ) : evolucaoReceita && evolucaoReceita.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoReceita}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="data"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => {
                    // Formatar data dependendo da granularidade
                    if (value.includes('-S')) {
                      return value; // Semanas
                    } else if (value.length === 7) {
                      return value; // YYYY-MM
                    } else {
                      const [ano, mes, dia] = value.split('-');
                      return `${dia}/${mes}`;
                    }
                  }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendas por Vendedor */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-chart-2" />
              Vendas por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingVendas ? (
              <Skeleton className="h-[300px] w-full" />
            ) : vendasPorVendedor && vendasPorVendedor.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendasPorVendedor}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="vendedor"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
