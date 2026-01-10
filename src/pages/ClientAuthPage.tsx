import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Loader2, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Default consultant ID (Rafael Egg)
const DEFAULT_CONSULTANT_ID = "e850e3e3-1682-4cb0-af43-d7dade2aff9e";

const signUpSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").regex(/^[\d\s+\-()]+$/, "Telefone inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export function ClientAuthPage() {
  const { consultantId: urlConsultantId } = useParams<{ consultantId: string }>();
  const consultantId = urlConsultantId || DEFAULT_CONSULTANT_ID;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  // Sign up form
  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  
  // Sign in form
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});
    
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setSignUpErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/consultoria/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signUpData.fullName,
            is_consulting_client: true,
            consultant_id: consultantId,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.");
          setActiveTab("login");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Create client profile with is_approved = false
        const { error: profileError } = await supabase
          .from("client_profiles")
          .insert({
            user_id: data.user.id,
            consultant_id: consultantId,
            full_name: signUpData.fullName,
            email: signUpData.email,
            phone: signUpData.phone,
            is_approved: false,
          });

        if (profileError) {
          console.error("Error creating client profile:", profileError);
          toast.error("Erro ao criar perfil. Tente novamente.");
          return;
        }

        // Create initial form progress
        await supabase
          .from("diagnostic_form_progress")
          .insert({
            client_user_id: data.user.id,
            consultant_id: consultantId,
            current_step: 1,
            form_data: {},
          });

        // Create timeline event
        await supabase
          .from("client_timeline_events")
          .insert({
            client_user_id: data.user.id,
            consultant_id: consultantId,
            event_type: "signup",
            title: "Cadastro realizado",
            description: "Aguardando aprovação do consultor.",
          });

        // Notify consultant and client via WhatsApp
        try {
          await supabase.functions.invoke("notify-client-signup", {
            body: {
              clientName: signUpData.fullName,
              clientEmail: signUpData.email,
              clientPhone: signUpData.phone,
            },
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
          // Don't block signup if notification fails
        }

        setSignupSuccess(true);
        toast.success("Cadastro realizado! Aguarde a aprovação do consultor.");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setSignInErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if client is approved
      if (authData.user) {
        const { data: profile } = await supabase
          .from("client_profiles")
          .select("is_approved")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (profile && !profile.is_approved) {
          await supabase.auth.signOut();
          toast.error("Seu cadastro ainda está aguardando aprovação. Você receberá um e-mail quando for aprovado.");
          return;
        }
      }

      toast.success("Login realizado com sucesso!");
      navigate("/consultoria/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Show success message after signup
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Cadastro Realizado!</h1>
          
          <p className="text-muted-foreground mb-6">
            Seu cadastro foi enviado com sucesso. Aguarde a aprovação do consultor para acessar a área do cliente.
          </p>
          
          <p className="text-sm text-muted-foreground mb-8">
            Você receberá uma notificação por e-mail quando seu acesso for liberado.
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSignupSuccess(false);
                setActiveTab("login");
              }}
            >
              Já fui aprovado - Fazer Login
            </Button>
            
            <Link to="/consultoria">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a página da consultoria
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/consultoria" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Área do Cliente</h1>
          <p className="text-muted-foreground">Consultoria IDEA</p>
        </div>
        
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                <TabsTrigger value="login">Entrar</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            {activeTab === "signup" ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    placeholder="Seu nome completo"
                    disabled={loading}
                  />
                  {signUpErrors.fullName && (
                    <p className="text-sm text-destructive">{signUpErrors.fullName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                  {signUpErrors.email && (
                    <p className="text-sm text-destructive">{signUpErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">WhatsApp</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    placeholder="(27) 99999-9999"
                    disabled={loading}
                  />
                  {signUpErrors.phone && (
                    <p className="text-sm text-destructive">{signUpErrors.phone}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  {signUpErrors.password && (
                    <p className="text-sm text-destructive">{signUpErrors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    placeholder="Repita a senha"
                    disabled={loading}
                  />
                  {signUpErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{signUpErrors.confirmPassword}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-mail</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                  {signInErrors.email && (
                    <p className="text-sm text-destructive">{signInErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    placeholder="Sua senha"
                    disabled={loading}
                  />
                  {signInErrors.password && (
                    <p className="text-sm text-destructive">{signInErrors.password}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Entrar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Ao se cadastrar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
