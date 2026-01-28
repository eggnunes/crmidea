import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export function CompleteProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [name, setName] = useState('');
  
  // Pre-fill name from Google if available
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    } else if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
    }
  }, [user]);

  // Check if profile is already complete
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }
      
      // Check if user has name in metadata
      const hasName = user.user_metadata?.name || user.user_metadata?.full_name;
      const isProfileComplete = user.user_metadata?.profile_complete === true;
      
      if (hasName && isProfileComplete) {
        // Profile already complete, redirect to main app
        navigate('/metodo-idea', { replace: true });
        return;
      }
      
      setCheckingProfile(false);
    };
    
    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          full_name: name.trim(),
          profile_complete: true,
        }
      });

      if (error) throw error;

      toast({
        title: "Perfil completo!",
        description: "Bem-vindo ao CRM IDEA",
      });

      navigate('/metodo-idea', { replace: true });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">CRM IDEA</h1>
          <p className="text-muted-foreground">Complete seu cadastro para continuar</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl text-center">Quase lá!</CardTitle>
            <CardDescription className="text-center">
              Precisamos de mais algumas informações para configurar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Show email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Conectado via Google
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
