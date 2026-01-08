import { useState, useEffect } from "react";
import { Settings, Bell, User, Palette, Database, Shield, Send, Loader2, Link2, CheckCircle, XCircle, RefreshCw, Sparkles, BarChart3, FileText, MousePointerClick } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { WelcomeTemplatesManager } from "@/components/WelcomeTemplatesManager";
import { PersonalWhatsAppConfig } from "@/components/PersonalWhatsAppConfig";
import { FollowUpTemplatesManager } from "@/components/FollowUpTemplatesManager";
import { FollowUpDashboard } from "@/components/FollowUpDashboard";
import { BlogPostsManager } from "@/components/blog/BlogPostsManager";
import { BioAnalytics } from "@/components/bio/BioAnalytics";


export function SettingsPage() {
  const { user } = useAuth();
  const { settings, loading, saveSettings } = useFollowUpSettings();
  const { toast } = useToast();
  const [testingManyChat, setTestingManyChat] = useState(false);
  const [testingKiwify, setTestingKiwify] = useState(false);
  const [settingUpKiwifyWebhook, setSettingUpKiwifyWebhook] = useState(false);
  const [syncingManyChat, setSyncingManyChat] = useState(false);
  const [kiwifyStatus, setKiwifyStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [manychatTags, setManychatTags] = useState<string[]>([]);
  
  const [daysWithoutInteraction, setDaysWithoutInteraction] = useState(settings?.days_without_interaction ?? 7);
  const [notifyInApp, setNotifyInApp] = useState(settings?.notify_in_app ?? true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(settings?.notify_whatsapp ?? true);
  const [manychatSubscriberId, setManychatSubscriberId] = useState(settings?.manychat_subscriber_id ?? "");

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setDaysWithoutInteraction(settings.days_without_interaction);
      setNotifyInApp(settings.notify_in_app);
      setNotifyWhatsapp(settings.notify_whatsapp);
      setManychatSubscriberId(settings.manychat_subscriber_id ?? "");
    }
  }, [settings]);

  const handleSaveNotifications = async () => {
    await saveSettings({
      days_without_interaction: daysWithoutInteraction,
      notify_in_app: notifyInApp,
      notify_whatsapp: notifyWhatsapp,
      manychat_subscriber_id: manychatSubscriberId || null,
    });
  };

  const handleTestWhatsApp = async () => {
    // Usa o ID salvo no banco de dados (settings) ou o valor local
    const subscriberId = settings?.manychat_subscriber_id || manychatSubscriberId;
    
    if (!subscriberId) {
      toast({
        title: "ID não configurado",
        description: "Por favor, insira e salve seu ID de subscriber do ManyChat primeiro.",
        variant: "destructive",
      });
      return;
    }

    setTestingManyChat(true);
    try {
      console.log("Calling test-manychat with subscriber_id:", subscriberId);
      
      const { data, error } = await supabase.functions.invoke("test-manychat", {
        body: {
          subscriber_id: subscriberId,
        },
      });

      console.log("test-manychat response:", data, error);

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Teste enviado!",
          description: "Verifique seu WhatsApp para a mensagem de teste com o Flow de follow-up.",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: data.error || data.details?.message || "Não foi possível enviar o Flow de teste.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing WhatsApp:", error);
      toast({
        title: "Erro",
        description: "Falha ao testar integração com WhatsApp/ManyChat.",
        variant: "destructive",
      });
    } finally {
      setTestingManyChat(false);
    }
  };

  const handleTestKiwify = async () => {
    setTestingKiwify(true);
    try {
      const { data, error } = await supabase.functions.invoke("kiwify-auth");
      
      if (error) throw error;
      
      if (data.success) {
        setKiwifyStatus('connected');
        toast({
          title: "Kiwify conectada!",
          description: "Autenticação com a API da Kiwify funcionando corretamente.",
        });
      } else {
        setKiwifyStatus('error');
        toast({
          title: "Erro na conexão",
          description: data.error || "Verifique suas credenciais da Kiwify.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing Kiwify:", error);
      setKiwifyStatus('error');
      toast({
        title: "Erro",
        description: "Falha ao testar integração com Kiwify.",
        variant: "destructive",
      });
    } finally {
      setTestingKiwify(false);
    }
  };

  const handleSetupKiwifyWebhook = async () => {
    setSettingUpKiwifyWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke("kiwify-setup-webhook");
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Webhook configurado!",
          description: data.message || "Webhook da Kiwify configurado com sucesso.",
        });
      } else {
        toast({
          title: "Erro na configuração",
          description: data.error || "Não foi possível configurar o webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error setting up Kiwify webhook:", error);
      toast({
        title: "Erro",
        description: "Falha ao configurar webhook da Kiwify.",
        variant: "destructive",
      });
    } finally {
      setSettingUpKiwifyWebhook(false);
    }
  };

  const handleSyncManyChat = async () => {
    setSyncingManyChat(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-manychat-leads", {
        body: { action: 'sync_all' }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Sincronização concluída!",
          description: `${data.synced} leads sincronizados com ManyChat.`,
        });
      } else {
        toast({
          title: "Erro na sincronização",
          description: data.error || "Não foi possível sincronizar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing ManyChat:", error);
      toast({
        title: "Erro",
        description: "Falha ao sincronizar com ManyChat.",
        variant: "destructive",
      });
    } finally {
      setSyncingManyChat(false);
    }
  };

  const handleGetManyChatTags = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-manychat-leads", {
        body: { action: 'get_tags' }
      });
      
      if (error) throw error;
      
      if (data.success && data.tags?.data) {
        const tagNames = data.tags.data.map((t: { name: string }) => t.name);
        setManychatTags(tagNames);
        toast({
          title: "Tags carregadas",
          description: `${tagNames.length} tags encontradas no ManyChat.`,
        });
      }
    } catch (error) {
      console.error("Error getting ManyChat tags:", error);
      toast({
        title: "Erro",
        description: "Falha ao buscar tags do ManyChat.",
        variant: "destructive",
      });
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
        <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-flex">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Follow-up</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Blog</span>
          </TabsTrigger>
          <TabsTrigger value="bio" className="gap-2">
            <MousePointerClick className="w-4 h-4" />
            <span className="hidden sm:inline">Bio</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Integrações</span>
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
                      onClick={handleTestWhatsApp}
                      disabled={testingManyChat || (!settings?.manychat_subscriber_id && !manychatSubscriberId)}
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
                          Testar WhatsApp
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

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <WelcomeTemplatesManager />
          <PersonalWhatsAppConfig />
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="space-y-6">
          <FollowUpDashboard />
          <FollowUpTemplatesManager />
        </TabsContent>

        {/* Blog Tab */}
        <TabsContent value="blog" className="space-y-6">
          <BlogPostsManager />
        </TabsContent>

        {/* Bio Analytics Tab */}
        <TabsContent value="bio" className="space-y-6">
          <BioAnalytics />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Kiwify Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">K</span>
                  </div>
                  <div>
                    <CardTitle>Kiwify</CardTitle>
                    <CardDescription>Receba leads automaticamente das suas vendas</CardDescription>
                  </div>
                </div>
                <Badge variant={kiwifyStatus === 'connected' ? 'default' : kiwifyStatus === 'error' ? 'destructive' : 'secondary'}>
                  {kiwifyStatus === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {kiwifyStatus === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                  {kiwifyStatus === 'connected' ? 'Conectado' : kiwifyStatus === 'error' ? 'Erro' : 'Não testado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A integração com Kiwify permite receber automaticamente novos leads quando:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>PIX ou Boleto é gerado (lead qualificado)</li>
                <li>Carrinho é abandonado (lead em contato)</li>
                <li>Compra é aprovada (lead fechado ganho)</li>
                <li>Reembolso ou chargeback (lead fechado perdido)</li>
              </ul>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleTestKiwify}
                  disabled={testingKiwify}
                  className="flex-1"
                >
                  {testingKiwify ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleSetupKiwifyWebhook}
                  disabled={settingUpKiwifyWebhook}
                  className="flex-1"
                >
                  {settingUpKiwifyWebhook ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Configurar Webhook
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ManyChat Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <div>
                    <CardTitle>ManyChat</CardTitle>
                    <CardDescription>Sincronize leads e tags com Instagram/WhatsApp</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A integração com ManyChat permite:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Sincronizar status de leads como tags</li>
                <li>Atualizar campos customizados do subscriber</li>
                <li>Receber notificações de follow-up via WhatsApp</li>
                <li>Identificar leads vindos do Instagram</li>
              </ul>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleGetManyChatTags}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Carregar Tags
                </Button>
                <Button 
                  onClick={handleSyncManyChat}
                  disabled={syncingManyChat}
                  className="flex-1"
                >
                  {syncingManyChat ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar Leads
                    </>
                  )}
                </Button>
              </div>

              {manychatTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags disponíveis no ManyChat:</Label>
                  <div className="flex flex-wrap gap-2">
                    {manychatTags.slice(0, 20).map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                    {manychatTags.length > 20 && (
                      <Badge variant="secondary">+{manychatTags.length - 20} mais</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como funciona a automação?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. <strong>Kiwify → CRM:</strong> Quando alguém gera PIX/boleto ou compra, um lead é criado automaticamente</p>
              <p>2. <strong>CRM → ManyChat:</strong> O status e produto do lead são sincronizados como tags no ManyChat</p>
              <p>3. <strong>ManyChat → WhatsApp:</strong> Você pode criar automações no ManyChat baseadas nessas tags</p>
              <p>4. <strong>Follow-up automático:</strong> Leads sem interação por X dias geram notificações no app e WhatsApp</p>
            </CardContent>
          </Card>
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
