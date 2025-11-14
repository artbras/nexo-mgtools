import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Briefcase, TrendingUp, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: string;
  email: string;
  nome: string;
  role: string;
  vendedor_id: string | null;
  created_at: string;
};

type Vendedor = {
  id: number;
  nome: string;
  email: string;
  regiao: string;
  meta_mensal: number;
  ativo: boolean;
  created_at: string;
};

export default function Admin() {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateVendedorOpen, setIsCreateVendedorOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", nome: "", password: "", role: "user" });
  const [newVendedor, setNewVendedor] = useState({
    nome: "",
    email: "",
    regiao: "",
    meta_mensal: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Verificar role do usuário
  const { data: currentUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Queries
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: vendedores = [], isLoading: loadingVendedores } = useQuery<Vendedor[]>({
    queryKey: ["/api/vendedores"],
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateUserOpen(false);
      setNewUser({ email: "", nome: "", password: "", role: "user" });
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    },
  });

  const createVendedorMutation = useMutation({
    mutationFn: async (vendedorData: any) => {
      await apiRequest("POST", "/api/vendedores", vendedorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendedores"] });
      setIsCreateVendedorOpen(false);
      setNewVendedor({ nome: "", email: "", regiao: "", meta_mensal: 0 });
      toast({
        title: "Vendedor criado",
        description: "O vendedor foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar vendedor",
        description: error.message || "Não foi possível criar o vendedor.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.nome || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar um usuário.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleCreateVendedor = () => {
    if (!newVendedor.nome || !newVendedor.email || !newVendedor.regiao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar um vendedor.",
        variant: "destructive",
      });
      return;
    }
    createVendedorMutation.mutate(newVendedor);
  };

  // Verificação de permissão
  if (loadingUser) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar esta página. Apenas administradores podem
              gerenciar usuários e vendedores do sistema.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administração</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários, vendedores e permissões do sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Usuários cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendedores.filter((v) => v.ativo).length}
              </div>
              <p className="text-xs text-muted-foreground">De {vendedores.length} vendedores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "admin").length}
              </div>
              <p className="text-xs text-muted-foreground">Usuários com acesso admin</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="vendedores" data-testid="tab-vendedores">
              Vendedores
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Usuários do Sistema</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie os usuários com acesso ao NEXO
                </p>
              </div>
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-user">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo usuário do sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-nome">Nome Completo</Label>
                      <Input
                        id="user-nome"
                        value={newUser.nome}
                        onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                        placeholder="João Silva"
                        data-testid="input-user-nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="joao@mgtools.com"
                        data-testid="input-user-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-password">Senha</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                        data-testid="input-user-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-role">Função</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger id="user-role" data-testid="select-user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                      data-testid="button-submit-user"
                    >
                      {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">{user.nome}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                            >
                              {user.role === "admin"
                                ? "Admin"
                                : user.role === "vendedor"
                                ? "Vendedor"
                                : "Usuário"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendedores Tab */}
          <TabsContent value="vendedores" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Vendedores</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie a equipe de vendas e suas metas
                </p>
              </div>
              <Dialog open={isCreateVendedorOpen} onOpenChange={setIsCreateVendedorOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-vendedor">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Vendedor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Vendedor</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo vendedor
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendedor-nome">Nome Completo</Label>
                      <Input
                        id="vendedor-nome"
                        value={newVendedor.nome}
                        onChange={(e) =>
                          setNewVendedor({ ...newVendedor, nome: e.target.value })
                        }
                        placeholder="Maria Santos"
                        data-testid="input-vendedor-nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendedor-email">Email</Label>
                      <Input
                        id="vendedor-email"
                        type="email"
                        value={newVendedor.email}
                        onChange={(e) =>
                          setNewVendedor({ ...newVendedor, email: e.target.value })
                        }
                        placeholder="maria@mgtools.com"
                        data-testid="input-vendedor-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendedor-regiao">Região</Label>
                      <Input
                        id="vendedor-regiao"
                        value={newVendedor.regiao}
                        onChange={(e) =>
                          setNewVendedor({ ...newVendedor, regiao: e.target.value })
                        }
                        placeholder="Sudeste"
                        data-testid="input-vendedor-regiao"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendedor-meta">Meta Mensal (R$)</Label>
                      <Input
                        id="vendedor-meta"
                        type="number"
                        value={newVendedor.meta_mensal}
                        onChange={(e) =>
                          setNewVendedor({
                            ...newVendedor,
                            meta_mensal: parseFloat(e.target.value),
                          })
                        }
                        placeholder="50000"
                        data-testid="input-vendedor-meta"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateVendedor}
                      disabled={createVendedorMutation.isPending}
                      data-testid="button-submit-vendedor"
                    >
                      {createVendedorMutation.isPending ? "Criando..." : "Criar Vendedor"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead>Meta Mensal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingVendedores ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : vendedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum vendedor encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendedores.map((vendedor) => (
                        <TableRow key={vendedor.id} data-testid={`row-vendedor-${vendedor.id}`}>
                          <TableCell className="font-medium">{vendedor.nome}</TableCell>
                          <TableCell>{vendedor.email}</TableCell>
                          <TableCell>{vendedor.regiao}</TableCell>
                          <TableCell>
                            R${" "}
                            {vendedor.meta_mensal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={vendedor.ativo ? "default" : "secondary"}>
                              {vendedor.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
