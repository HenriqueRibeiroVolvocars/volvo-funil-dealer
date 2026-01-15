import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export function AuthGuard({ children, requiredRoles = [], fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, login, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
              <CardDescription>
                Você precisa fazer login para acessar esta aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={login} size="lg" className="gap-2">
                <LogIn className="w-4 h-4" />
                Entrar com Entra ID
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Acesso Negado</CardTitle>
                <CardDescription>
                  Você não tem permissão para acessar esta página. 
                  Roles necessárias: {requiredRoles.join(', ')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
}

