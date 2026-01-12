import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  RefreshCw, 
  User, 
  CreditCard, 
  History, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Webhook,
  Copy,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionData {
  id: string;
  original_transaction_id: string;
  product_id: string | null;
  bundle_id: string | null;
  status: string;
  expires_date: string | null;
  purchase_date: string | null;
  renewal_info: any;
  last_transaction_id: string | null;
  environment: string | null;
  app_account_token: string | null;
  user_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WebhookEvent {
  id: string;
  notification_type: string;
  subtype: string | null;
  notification_uuid: string | null;
  transaction_id: string | null;
  original_transaction_id: string | null;
  product_id: string | null;
  bundle_id: string | null;
  environment: string | null;
  created_at: string;
}

interface ApiResult {
  success: boolean;
  data?: any;
  error?: string;
  environment?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<any> }> = {
  active: { label: "Ativa", variant: "default", icon: CheckCircle },
  expired: { label: "Expirada", variant: "destructive", icon: XCircle },
  grace_period: { label: "Período de Graça", variant: "secondary", icon: Clock },
  billing_retry: { label: "Tentativa de Cobrança", variant: "secondary", icon: AlertCircle },
  refunded: { label: "Reembolsada", variant: "destructive", icon: XCircle },
  revoked: { label: "Revogada", variant: "destructive", icon: XCircle },
  will_expire: { label: "Vai Expirar", variant: "outline", icon: Clock },
  resubscribed: { label: "Reativada", variant: "default", icon: CheckCircle },
  unknown: { label: "Desconhecido", variant: "outline", icon: AlertCircle },
};

export function SubscriptionManager() {
  const [searchType, setSearchType] = useState<"email" | "transaction">("email");
  const [searchValue, setSearchValue] = useState("");
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [isSearching, setIsSearching] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<SubscriptionData[]>([]);
  const [allEvents, setAllEvents] = useState<WebhookEvent[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [notes, setNotes] = useState("");

  const searchSubscription = async () => {
    if (!searchValue.trim()) {
      toast.error("Digite um valor para buscar");
      return;
    }

    setIsSearching(true);
    setSubscription(null);
    setApiResult(null);
    setWebhookEvents([]);

    try {
      // Search in local database first
      let query = supabase.from("appstore_subscriptions").select("*");
      
      if (searchType === "email") {
        query = query.ilike("user_email", `%${searchValue}%`);
      } else {
        query = query.or(`original_transaction_id.eq.${searchValue},last_transaction_id.eq.${searchValue}`);
      }

      const { data: localData, error: localError } = await query.maybeSingle();

      if (localError && localError.code !== "PGRST116") {
        console.error("Local search error:", localError);
      }

      if (localData) {
        setSubscription(localData);
        setNotes(localData.notes || "");

        // Load webhook events for this subscription
        const { data: events } = await supabase
          .from("appstore_webhook_events")
          .select("*")
          .eq("original_transaction_id", localData.original_transaction_id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (events) {
          setWebhookEvents(events);
        }
      }

      // If searching by transaction ID, also query Apple API
      if (searchType === "transaction") {
        const { data: apiData, error: apiError } = await supabase.functions.invoke("validate-iap-receipt", {
          body: {
            action: "subscription_status",
            transactionId: searchValue,
            environment,
          },
        });

        if (apiError) {
          console.error("API error:", apiError);
          setApiResult({ success: false, error: apiError.message });
        } else {
          setApiResult(apiData);
        }
      }

      if (!localData && searchType === "email") {
        toast.info("Nenhuma assinatura encontrada com este email");
      }

    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erro ao buscar assinatura");
    } finally {
      setIsSearching(false);
    }
  };

  const queryAppleApi = async (action: string) => {
    if (!subscription?.original_transaction_id && !searchValue) {
      toast.error("Nenhuma transação para consultar");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-iap-receipt", {
        body: {
          action,
          transactionId: subscription?.original_transaction_id || searchValue,
          environment,
        },
      });

      if (error) {
        toast.error(`Erro: ${error.message}`);
        setApiResult({ success: false, error: error.message });
      } else {
        setApiResult(data);
        toast.success("Consulta realizada com sucesso");
      }
    } catch (error) {
      console.error("API query error:", error);
      toast.error("Erro ao consultar API");
    } finally {
      setIsSearching(false);
    }
  };

  const updateSubscriptionNotes = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from("appstore_subscriptions")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", subscription.id);

      if (error) throw error;
      toast.success("Notas atualizadas");
      setSubscription({ ...subscription, notes });
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Erro ao atualizar notas");
    }
  };

  const updateSubscriptionEmail = async (email: string) => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from("appstore_subscriptions")
        .update({ user_email: email, updated_at: new Date().toISOString() })
        .eq("id", subscription.id);

      if (error) throw error;
      toast.success("Email atualizado");
      setSubscription({ ...subscription, user_email: email });
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Erro ao atualizar email");
    }
  };

  const loadAllData = async () => {
    setIsLoadingAll(true);
    try {
      const [subsResult, eventsResult] = await Promise.all([
        supabase
          .from("appstore_subscriptions")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(100),
        supabase
          .from("appstore_webhook_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (subsResult.data) setAllSubscriptions(subsResult.data);
      if (eventsResult.data) setAllEvents(eventsResult.data);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoadingAll(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appstore-webhook`;

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.unknown;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Webhook URL Card */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook do App Store
          </CardTitle>
          <CardDescription className="text-white/60">
            Configure esta URL no App Store Connect em "App Store Server Notifications"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">URL do Webhook</label>
            <div className="flex gap-2">
              <Input 
                value={webhookUrl} 
                readOnly 
                className="bg-white/10 border-white/20 text-white font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <a 
                href="https://appstoreconnect.apple.com/apps" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
          
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <label className="text-green-400 text-sm font-medium mb-2 block flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Shared Secret (Segredo Configurado)
            </label>
            <div className="flex gap-2">
              <Input 
                value="AITeleprompterWebhook2025SecureKey" 
                readOnly 
                className="bg-white/10 border-white/20 text-white font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => copyToClipboard("AITeleprompterWebhook2025SecureKey")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Cole este valor no campo "Secret" ao configurar o webhook no App Store Connect.
            </p>
          </div>

          <p className="text-xs text-white/40">
            No App Store Connect: App → App Information → App Store Server Notifications → Production/Sandbox Server URL
          </p>
        </CardContent>
      </Card>

      {/* Search Card */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultar Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Select value={searchType} onValueChange={(v) => setSearchType(v as "email" | "transaction")}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Por Email</SelectItem>
                <SelectItem value="transaction">Por ID de Transação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={environment} onValueChange={(v) => setEnvironment(v as "production" | "sandbox")}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Produção</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 flex gap-2">
              <Input
                placeholder={searchType === "email" ? "email@exemplo.com" : "ID da Transação Original"}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                onKeyDown={(e) => e.key === "Enter" && searchSubscription()}
              />
              <Button 
                onClick={searchSubscription}
                disabled={isSearching}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {subscription && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Details */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Detalhes da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Status</span>
                <StatusBadge status={subscription.status} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">ID Original</span>
                  <span className="text-white font-mono text-sm">{subscription.original_transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Produto</span>
                  <span className="text-white">{subscription.product_id || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Ambiente</span>
                  <Badge variant={subscription.environment === "Production" ? "default" : "secondary"}>
                    {subscription.environment || "-"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Data de Compra</span>
                  <span className="text-white">
                    {subscription.purchase_date 
                      ? format(new Date(subscription.purchase_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Expira em</span>
                  <span className="text-white">
                    {subscription.expires_date 
                      ? format(new Date(subscription.expires_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-white/60 text-sm">Email do Usuário</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@exemplo.com"
                    defaultValue={subscription.user_email || ""}
                    className="bg-white/10 border-white/20 text-white"
                    onBlur={(e) => updateSubscriptionEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/60 text-sm">Notas</label>
                <Textarea
                  placeholder="Adicionar notas sobre esta assinatura..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/10 border-white/20 text-white min-h-20"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={updateSubscriptionNotes}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Salvar Notas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Actions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Consultas à API da Apple
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => queryAppleApi("subscription_status")}
                  disabled={isSearching}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Status da Assinatura
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => queryAppleApi("validate_transaction")}
                  disabled={isSearching}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Histórico de Transações
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => queryAppleApi("refund_history")}
                  disabled={isSearching}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Histórico de Reembolsos
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => queryAppleApi("request_consumption")}
                  disabled={isSearching}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Solicitar Consumo
                </Button>
              </div>

              {apiResult && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {apiResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-white/60 text-sm">
                      Resultado ({apiResult.environment || environment})
                    </span>
                  </div>
                  <ScrollArea className="h-48 rounded border border-white/10 bg-black/20 p-3">
                    <pre className="text-xs text-white/80 whitespace-pre-wrap">
                      {JSON.stringify(apiResult.data || apiResult.error, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhook Events for this subscription */}
      {webhookEvents.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Eventos de Webhook ({webhookEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60">Data</TableHead>
                    <TableHead className="text-white/60">Tipo</TableHead>
                    <TableHead className="text-white/60">Subtipo</TableHead>
                    <TableHead className="text-white/60">Ambiente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookEvents.map((event) => (
                    <TableRow key={event.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white/80">
                        {format(new Date(event.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-white border-white/30">
                          {event.notification_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/60">{event.subtype || "-"}</TableCell>
                      <TableCell className="text-white/60">{event.environment || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* All Subscriptions & Events */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Todas as Assinaturas & Eventos</CardTitle>
            <Button 
              onClick={loadAllData}
              disabled={isLoadingAll}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {isLoadingAll ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Carregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subscriptions" className="space-y-4">
            <TabsList className="bg-white/10 border border-white/10">
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-purple-600 text-white/70 data-[state=active]:text-white">
                Assinaturas ({allSubscriptions.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-purple-600 text-white/70 data-[state=active]:text-white">
                Eventos ({allEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions">
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">ID Transação</TableHead>
                      <TableHead className="text-white/60">Produto</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                      <TableHead className="text-white/60">Email</TableHead>
                      <TableHead className="text-white/60">Atualizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSubscriptions.map((sub) => (
                      <TableRow 
                        key={sub.id} 
                        className="border-white/10 hover:bg-white/5 cursor-pointer"
                        onClick={() => {
                          setSearchType("transaction");
                          setSearchValue(sub.original_transaction_id);
                          searchSubscription();
                        }}
                      >
                        <TableCell className="text-white/80 font-mono text-xs">
                          {sub.original_transaction_id}
                        </TableCell>
                        <TableCell className="text-white/80">{sub.product_id || "-"}</TableCell>
                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                        <TableCell className="text-white/60">{sub.user_email || "-"}</TableCell>
                        <TableCell className="text-white/60">
                          {format(new Date(sub.updated_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="events">
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Data</TableHead>
                      <TableHead className="text-white/60">Tipo</TableHead>
                      <TableHead className="text-white/60">Subtipo</TableHead>
                      <TableHead className="text-white/60">ID Transação</TableHead>
                      <TableHead className="text-white/60">Produto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEvents.map((event) => (
                      <TableRow key={event.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white/80">
                          {format(new Date(event.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-white border-white/30">
                            {event.notification_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/60">{event.subtype || "-"}</TableCell>
                        <TableCell className="text-white/60 font-mono text-xs">
                          {event.original_transaction_id || "-"}
                        </TableCell>
                        <TableCell className="text-white/60">{event.product_id || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}