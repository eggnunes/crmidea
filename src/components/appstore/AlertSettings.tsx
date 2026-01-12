import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Star, XCircle, RefreshCw, AlertTriangle, Check, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlertSetting {
  id: string;
  alert_type: string;
  is_active: boolean;
  email_enabled: boolean;
  email_address: string | null;
  min_rating: number | null;
}

interface AlertLog {
  id: string;
  alert_type: string;
  reference_id: string | null;
  email_sent_to: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const ALERT_TYPES = [
  {
    type: 'negative_review',
    label: 'Reviews Negativas',
    description: 'Alertar quando receber reviews de 1-2 estrelas',
    icon: Star,
    defaultMinRating: 2,
  },
  {
    type: 'subscription_cancelled',
    label: 'Cancelamentos',
    description: 'Alertar quando uma assinatura for cancelada ou reembolsada',
    icon: XCircle,
  },
  {
    type: 'billing_failed',
    label: 'Falha de Cobrança',
    description: 'Alertar quando houver falha na renovação automática',
    icon: AlertTriangle,
  },
  {
    type: 'new_subscription',
    label: 'Nova Assinatura',
    description: 'Alertar quando receber uma nova assinatura',
    icon: Check,
  },
];

export function AlertSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultEmail, setDefaultEmail] = useState('');

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchLogs();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('appstore_alert_settings')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Initialize settings for all alert types
      const allSettings = ALERT_TYPES.map(alertType => {
        const existing = data?.find(s => s.alert_type === alertType.type);
        return existing || {
          id: '',
          alert_type: alertType.type,
          is_active: false,
          email_enabled: true,
          email_address: defaultEmail,
          min_rating: alertType.defaultMinRating || null,
        };
      });

      setSettings(allSettings);
    } catch (error) {
      console.error('Error fetching alert settings:', error);
      toast.error('Erro ao carregar configurações de alertas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('appstore_alerts_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching alert logs:', error);
    }
  };

  const handleToggle = (alertType: string, field: 'is_active' | 'email_enabled', value: boolean) => {
    setSettings(prev => prev.map(s => 
      s.alert_type === alertType ? { ...s, [field]: value } : s
    ));
  };

  const handleEmailChange = (alertType: string, email: string) => {
    setSettings(prev => prev.map(s => 
      s.alert_type === alertType ? { ...s, email_address: email } : s
    ));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      for (const setting of settings) {
        if (setting.id) {
          // Update existing
          await supabase
            .from('appstore_alert_settings')
            .update({
              is_active: setting.is_active,
              email_enabled: setting.email_enabled,
              email_address: setting.email_address,
              min_rating: setting.min_rating,
              updated_at: new Date().toISOString(),
            })
            .eq('id', setting.id);
        } else {
          // Insert new
          await supabase
            .from('appstore_alert_settings')
            .insert({
              user_id: user.id,
              alert_type: setting.alert_type,
              is_active: setting.is_active,
              email_enabled: setting.email_enabled,
              email_address: setting.email_address,
              min_rating: setting.min_rating,
            });
        }
      }

      toast.success('Configurações salvas com sucesso!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10 p-6">
          <Skeleton className="h-6 w-48 bg-white/10 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full bg-white/10" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Configuration */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Configuração de Alertas</h3>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>

        <div className="space-y-4">
          {ALERT_TYPES.map((alertType) => {
            const setting = settings.find(s => s.alert_type === alertType.type);
            const Icon = alertType.icon;

            return (
              <div 
                key={alertType.type}
                className={`p-4 rounded-lg border transition-colors ${
                  setting?.is_active 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      setting?.is_active ? 'text-purple-400' : 'text-white/40'
                    }`} />
                    <div>
                      <div className="font-medium text-white">{alertType.label}</div>
                      <div className="text-sm text-white/60">{alertType.description}</div>
                    </div>
                  </div>
                  <Switch
                    checked={setting?.is_active || false}
                    onCheckedChange={(checked) => handleToggle(alertType.type, 'is_active', checked)}
                  />
                </div>

                {setting?.is_active && (
                  <div className="mt-4 pl-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`${alertType.type}-email`}
                        checked={setting?.email_enabled || false}
                        onCheckedChange={(checked) => handleToggle(alertType.type, 'email_enabled', checked)}
                      />
                      <Label htmlFor={`${alertType.type}-email`} className="text-white/70 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Enviar por email
                      </Label>
                    </div>

                    {setting?.email_enabled && (
                      <Input
                        type="email"
                        placeholder="Email para notificações"
                        value={setting?.email_address || ''}
                        onChange={(e) => handleEmailChange(alertType.type, e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 max-w-md"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Alert History */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Histórico de Alertas</h3>
        
        {logs.length === 0 ? (
          <div className="py-8 text-center text-white/50">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum alerta enviado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id}
                className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={log.status === 'sent' ? 'default' : 'destructive'}
                    className={log.status === 'sent' ? 'bg-green-500/20 text-green-400' : ''}
                  >
                    {log.status === 'sent' ? 'Enviado' : 'Erro'}
                  </Badge>
                  <div>
                    <div className="text-white text-sm">{log.message || log.alert_type}</div>
                    {log.email_sent_to && (
                      <div className="text-xs text-white/50">Para: {log.email_sent_to}</div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-white/50">
                  {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
