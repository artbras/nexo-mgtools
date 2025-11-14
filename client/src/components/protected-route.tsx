import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getCurrentUser, type User } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        setLocation("/login");
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    }

    checkAuth();
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
