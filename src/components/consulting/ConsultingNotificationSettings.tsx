import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Bell, Calendar, Clock, Save } from "lucide-react";

interface NotificationSettings {
  id?: string;
  monthly_report_enabled: boolean;
  monthly_report_day: number;
  inactivity_reminder_enabled: boolean;
  inactivity_reminder_days: number;
  booking_email_notification: boolean;
  diagnostic_email_notification: boolean;
  consultant_email: string;
  from_email_name: string;
  from_email_address: string;
}

const defaultSettings: NotificationSettings = {
  monthly_report_enabled: true,
  monthly_report_day: 1,
  inactivity_reminder_enabled: true,
  inactivity_reminder_days: 30,
  booking_email_notification: true,
  diagnostic_email_notification: true,
  consultant_email: "eggnunes@gmail.com",
  from_email_name: "Consultoria IDEA",
  from_email_address: "naoresponda@rafaelegg.com",
};

export function ConsultingNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("consultant_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as NotificationSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const settingsData = {
        user_id: user.id,
        monthly_report_enabled: settings.monthly_report_enabled,
        monthly_report_day: settings.monthly_report_day,
        inactivity_reminder_enabled: settings.inactivity_reminder_enabled,
        inactivity_reminder_days: settings.inactivity_reminder_days,
        booking_email_notification: settings.booking_email_notification,
        diagnostic_email_notification: settings.diagnostic_email_notification,
        consultant_email: settings.consultant_email,
        from_email_name: settings.from_email_name,
        from_email_address: settings.from_email_address,
      };

      const { error } = await supabase
        .from("consultant_notification_settings")
        .upsert(settingsData, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Configure o remetente e destinatário dos emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consultant_email">Seu Email (receber notificações)</Label>
              <Input
                id="consultant_email"
                type="email"
                value={settings.consultant_email}
                onChange={(e) => setSettings({ ...settings, consultant_email: e.target.value })}
                placeholder="seuemail@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email_name">Nome do Remetente</Label>
              <Input
                id="from_email_name"
                value={settings.from_email_name}
                onChange={(e) => setSettings({ ...settings, from_email_name: e.target.value })}
                placeholder="Consultoria IDEA"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_email_address">Endereço do Remetente</Label>
            <Input
              id="from_email_address"
              type="email"
              value={settings.from_email_address}
              onChange={(e) => setSettings({ ...settings, from_email_address: e.target.value })}
              placeholder="naoresponda@seudominio.com"
            />
            <p className="text-xs text-muted-foreground">
              Este domínio deve estar verificado no Resend
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Relatórios Mensais
          </CardTitle>
          <CardDescription>
            Envio automático de relatórios de progresso para clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar relatórios mensais</Label>
              <p className="text-sm text-muted-foreground">
                Envia automaticamente um resumo do progresso para cada cliente
              </p>
            </div>
            <Switch
              checked={settings.monthly_report_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, monthly_report_enabled: checked })}
            />
          </div>

          {settings.monthly_report_enabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Dia do mês para envio: {settings.monthly_report_day}</Label>
                <Slider
                  value={[settings.monthly_report_day]}
                  onValueChange={(value) => setSettings({ ...settings, monthly_report_day: value[0] })}
                  min={1}
                  max={28}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  O relatório será enviado todo dia {settings.monthly_report_day} de cada mês
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactivity Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Lembretes de Inatividade
          </CardTitle>
          <CardDescription>
            Notificações automáticas quando clientes ficam inativos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar lembretes de inatividade</Label>
              <p className="text-sm text-muted-foreground">
                Envia email cobrando atualização sobre a implementação
              </p>
            </div>
            <Switch
              checked={settings.inactivity_reminder_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, inactivity_reminder_enabled: checked })}
            />
          </div>

          {settings.inactivity_reminder_enabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Dias sem atividade: {settings.inactivity_reminder_days}</Label>
                <Slider
                  value={[settings.inactivity_reminder_days]}
                  onValueChange={(value) => setSettings({ ...settings, inactivity_reminder_days: value[0] })}
                  min={7}
                  max={60}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  O cliente receberá um email após {settings.inactivity_reminder_days} dias sem interação
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Tipos de Notificação
          </CardTitle>
          <CardDescription>
            Escolha quais notificações você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificação de agendamento</Label>
              <p className="text-sm text-muted-foreground">
                Receber email quando cliente agendar reunião
              </p>
            </div>
            <Switch
              checked={settings.booking_email_notification}
              onCheckedChange={(checked) => setSettings({ ...settings, booking_email_notification: checked })}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Notificação de diagnóstico</Label>
              <p className="text-sm text-muted-foreground">
                Receber email quando cliente completar diagnóstico
              </p>
            </div>
            <Switch
              checked={settings.diagnostic_email_notification}
              onCheckedChange={(checked) => setSettings({ ...settings, diagnostic_email_notification: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
