import { useState } from "react";
import { Settings, Bell, User, Palette, Database, Shield, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useFollowUpSettings } from "@/hooks/useFollowUpSettings";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { FollowUpLogsCard } from "@/components/FollowUpLogsCard";

export function SettingsPage() {
  const { user } = useAuth();
  const { settings, loading, saveSettings } = useFollowUpSettings();
  const { toast } = useToast();
  const [testingManyChat, setTestingManyChat] = useState(false);
  
  const [daysWithoutInteraction, setDaysWithoutInteraction] = useState(settings?.days_without_interaction ?? 7);
  const [notifyInApp, setNotifyInApp] = useState(settings?.notify_in_app ?? true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(settings?.notify_whatsapp ?? true);
  const [manychatSubscriberId, setManychatSubscriberId] = useState(settings?.manychat_subscriber_id ?? "");

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setDaysWithoutInteraction(settings.days_without_interaction);
      setNotifyInApp(settings.notify_in_app);
      setNotifyWhatsapp(settings.notify_whatsapp);
      setManychatSubscriberId(settings.manychat_subscriber_id ?? "");
    }
  });

  const handleSaveNotifications = async () => {
    await saveSettings({
      days_without_interaction: daysWithoutInteraction,
      notify_in_app: notifyInApp,
      notify_whatsapp: notifyWhatsapp,
      manychat_subscriber_id: manychatSubscriberId || null,
    });
  };

  const handleTestManyChat = async () => {
    if (!manychatSubscriberId) {
      toast({
        title: "ID não configurado",
        description: "Por favor, insira seu ID de subscriber do ManyChat primeiro.",
        variant: "destructive",
      });
      return;
    }

    setTestingManyChat(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-manychat", {
        body: {
          subscriber_id: manychatSubscriberId,
          message: "🧪 Teste de integração ManyChat-CRM realizado com sucesso! Se você está vendo esta mensagem, a integração está funcionando.",
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Teste enviado!",
          description: "Verifique seu WhatsApp para a mensagem de teste.",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: data.error || "Não foi possível enviar a mensagem de teste.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing ManyChat:", error);
      toast({
        title: "Erro",
        description: "Falha ao testar integração com ManyChat.",
        variant: "destructive",
      });
    } finally {
      setTestingManyChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize seu CRM</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Follow-up Automático
              </CardTitle>
              <CardDescription>
                Configure quando e como você deseja receber alertas de follow-up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dias sem interação para alerta</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[daysWithoutInteraction]}
                      onValueChange={(value) => setDaysWithoutInteraction(value[0])}
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-16 text-center font-medium text-foreground">
                      {daysWithoutInteraction} dias
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você receberá um alerta quando um lead ficar {daysWithoutInteraction} dias sem interação
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Canais de Notificação</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações no App</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas dentro do CRM
                      </p>
                    </div>
                    <Switch
                      checked={notifyInApp}
                      onCheckedChange={setNotifyInApp}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações via WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas pelo WhatsApp via ManyChat
                      </p>
                    </div>
                    <Switch
                      checked={notifyWhatsapp}
                      onCheckedChange={setNotifyWhatsapp}
                    />
                  </div>
                </div>

                {notifyWhatsapp && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>ID do Subscriber ManyChat</Label>
                      <Input
                        placeholder="Digite seu ID de subscriber"
                        value={manychatSubscriberId}
                        onChange={(e) => setManychatSubscriberId(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Encontre seu ID no painel do ManyChat em Audience → Subscribers
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleTestManyChat}
                      disabled={testingManyChat || !manychatSubscriberId}
                      className="w-full"
                    >
                      {testingManyChat ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando teste...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Testar Integração ManyChat
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              <Button onClick={handleSaveNotifications} disabled={loading}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          <FollowUpLogsCard />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Suas informações de conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
                <p className="text-sm text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label>ID do Usuário</Label>
                <Input value={user?.id ?? ""} disabled className="font-mono text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="w-5 h-5" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para excluir sua conta ou alterar sua senha, entre em contato com o suporte.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Tema
              </CardTitle>
              <CardDescription>
                Personalize a aparência do seu CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-primary rounded-lg p-4 cursor-pointer bg-background">
                  <div className="aspect-video bg-muted rounded mb-2"></div>
                  <p className="text-sm font-medium text-center">Tema Escuro</p>
                  <p className="text-xs text-muted-foreground text-center">Ativo</p>
                </div>
                <div className="border border-border rounded-lg p-4 cursor-not-allowed opacity-50">
                  <div className="aspect-video bg-gray-100 rounded mb-2"></div>
                  <p className="text-sm font-medium text-center">Tema Claro</p>
                  <p className="text-xs text-muted-foreground text-center">Em breve</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Exportação de Dados
              </CardTitle>
              <CardDescription>
                Exporte seus dados do CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use a funcionalidade de exportação na página de Leads para baixar seus dados em formato Excel ou CSV.
              </p>
              <Button variant="outline" asChild>
                <a href="/leads">Ir para Leads</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Uso</CardTitle>
              <CardDescription>
                Informações sobre seus dados armazenados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">—</p>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">—</p>
                  <p className="text-sm text-muted-foreground">Interações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
