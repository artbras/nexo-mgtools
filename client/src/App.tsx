import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { UserMenu } from "@/components/user-menu";
import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import Historico from "@/pages/historico";
import Relatorios from "@/pages/relatorios";
import Admin from "@/pages/admin";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/chat">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Chat />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/historico">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Historico />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/relatorios">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Relatorios />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Admin />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
