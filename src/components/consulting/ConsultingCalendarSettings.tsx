import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, ExternalLink, Copy, Check, Loader2, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";

interface ConsultingSettings {
  id: string;
  calendar_booking_url: string | null;
  whatsapp_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
}

export function ConsultingCalendarSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ConsultingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ synced: number; clientsProcessed?: number } | null>(null);
  
  const [formData, setFormData] = useState({
    calendar_booking_url: "",
    whatsapp_notifications_enabled: true,
    email_notifications_enabled: true
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("consulting_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings(data);
        setFormData({
          calendar_booking_url: data.calendar_booking_url || "",
          whatsapp_notifications_enabled: data.whatsapp_notifications_enabled ?? true,
          email_notifications_enabled: data.email_notifications_enabled ?? true
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      if (settings) {
        // Update existing
        const { error } = await supabase
          .from("consulting_settings")
          .update({
            calendar_booking_url: formData.calendar_booking_url || null,
            whatsapp_notifications_enabled: formData.whatsapp_notifications_enabled,
            email_notifications_enabled: formData.email_notifications_enabled
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("consulting_settings")
          .insert({
            user_id: user.id,
            calendar_booking_url: formData.calendar_booking_url || null,
            whatsapp_notifications_enabled: formData.whatsapp_notifications_enabled,
            email_notifications_enabled: formData.email_notifications_enabled
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }
      
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const copyBookingLink = async () => {
    if (formData.calendar_booking_url) {
      await navigator.clipboard.writeText(formData.calendar_booking_url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canSync = useMemo(() => !!user?.id, [user?.id]);

  const handleSyncAllFromGoogleCalendar = async () => {
    if (!user?.id) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-calendar-sessions", {
        body: {
          syncAll: true,
          consultantId: user.id,
        },
      });

      if (error) throw error;

      const synced = Number(data?.synced || 0);
      const clientsProcessed = Number(data?.clientsProcessed || 0) || undefined;
      setLastSync({ synced, clientsProcessed });

      if (synced > 0) {
        toast.success(`Sincronização concluída: ${synced} reunião(ões) importada(s).`);
      } else {
        toast.message("Sincronização concluída, mas nenhum novo evento foi encontrado.");
      }
    } catch (err) {
      console.error("Error syncing consulting sessions from Google Calendar:", err);
      toast.error("Erro ao sincronizar com o Google Calendar. Conecte novamente e tente de novo.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <GoogleCalendarConnect />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Importar agendamentos do Google Calendar
          </CardTitle>
          <CardDescription>
            Puxe os eventos do seu Google Calendar e registre automaticamente as sessões da consultoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSyncAllFromGoogleCalendar}
            disabled={!canSync || syncing}
            variant="outline"
            className="gap-2"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar agora
          </Button>

          {lastSync && (
            <p className="text-sm text-muted-foreground">
              Última sincronização: {lastSync.synced} evento(s) novo(s)
              {typeof lastSync.clientsProcessed === "number" ? ` • ${lastSync.clientsProcessed} cliente(s) verificado(s)` : ""}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendamento de Reuniões
          </CardTitle>
          <CardDescription>
            Configure o link para agendamento de reuniões da consultoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Link de Agendamento (Google Calendar, Calendly, etc.)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://calendar.app.google/..."
                value={formData.calendar_booking_url}
                onChange={(e) => setFormData(prev => ({ ...prev, calendar_booking_url: e.target.value }))}
                className="flex-1"
              />
              {formData.calendar_booking_url && (
                <>
                  <Button variant="outline" size="icon" onClick={copyBookingLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(formData.calendar_booking_url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Este link será enviado automaticamente aos clientes após preencherem o formulário de diagnóstico.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações Automáticas</CardTitle>
          <CardDescription>
            Configure como você deseja notificar os clientes da consultoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações via WhatsApp</Label>
              <p className="text-xs text-muted-foreground">
                Enviar mensagens automáticas pelo WhatsApp integrado
              </p>
            </div>
            <Switch
              checked={formData.whatsapp_notifications_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, whatsapp_notifications_enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações via E-mail</Label>
              <p className="text-xs text-muted-foreground">
                Enviar e-mails automáticos sobre a evolução da consultoria
              </p>
            </div>
            <Switch
              checked={formData.email_notifications_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, email_notifications_enabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
