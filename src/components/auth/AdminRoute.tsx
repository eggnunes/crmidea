import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();

  // Show loading while checking auth and roles
  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="text-muted-foreground">
              Esta área é exclusiva para administradores do sistema. 
              Se você é um cliente da consultoria, acesse sua área pelo link correto.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/consultoria/dashboard'}
            >
              Ir para Área do Cliente
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => signOut()}
            >
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
