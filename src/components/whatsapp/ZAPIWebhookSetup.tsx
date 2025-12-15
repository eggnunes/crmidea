import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Webhook, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ZAPIWebhookSetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<"configured" | "error" | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  const handleSetupWebhook = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("zapi-setup-webhook");

      if (error) throw error;

      if (data?.success) {
        setWebhookStatus("configured");
        setWebhookUrl(data.webhookUrl);
        toast({
          title: "Sucesso",
          description: "Webhook da Z-API configurado com sucesso!",
        });
      } else {
        throw new Error(data?.error || "Erro ao configurar webhook");
      }
    } catch (error) {
      console.error("Error setting up webhook:", error);
      setWebhookStatus("error");
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao configurar webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="w-5 h-5" />
          Configurar Webhook Z-API
        </CardTitle>
        <CardDescription>
          Configure o webhook para receber mensagens do WhatsApp automaticamente no CRM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            O webhook permite que o CRM receba mensagens do WhatsApp em tempo real.
            Quando alguém enviar uma mensagem para seu número, ela aparecerá automaticamente
            na aba de Conversas e o assistente de IA poderá responder.
          </AlertDescription>
        </Alert>

        {webhookStatus === "configured" && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-500 font-medium">
              <CheckCircle className="w-5 h-5" />
              Webhook configurado com sucesso!
            </div>
            {webhookUrl && (
              <p className="text-sm text-muted-foreground mt-2 break-all">
                URL: {webhookUrl}
              </p>
            )}
          </div>
        )}

        {webhookStatus === "error" && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-500 font-medium">
              <AlertCircle className="w-5 h-5" />
              Erro ao configurar webhook
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Verifique se as credenciais da Z-API estão corretas nas configurações.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSetupWebhook} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Webhook className="w-4 h-4 mr-2" />
            )}
            {webhookStatus === "configured" ? "Reconfigurar Webhook" : "Configurar Webhook"}
          </Button>
          
          <Button variant="outline" asChild>
            <a
              href="https://developer.z-api.io/webhooks/introduction"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentação Z-API
            </a>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-medium">O que será configurado:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Webhook para receber mensagens (ReceivedCallback)</li>
            <li>Webhook para status de entrega (DeliveryCallback)</li>
            <li>Webhook para status de mensagens (MessageStatusCallback)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
