import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, MessageSquare, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReminderTemplate {
  id?: string;
  template_type: string;
  message_template: string;
  is_active: boolean;
}

const defaultTemplates: Record<string, ReminderTemplate> = {
  booking_confirmation: {
    template_type: 'booking_confirmation',
    message_template: `✅ *Agendamento Confirmado!*

Olá {{nome}}! Seu agendamento foi confirmado com sucesso.

📅 *Data:* {{data}}
🕐 *Horário:* {{horario}}

Você receberá um lembrete 30 minutos antes da sessão.

Obrigado por agendar! Nos vemos em breve. 🚀`,
    is_active: true,
  },
  reminder_30min: {
    template_type: 'reminder_30min',
    message_template: `⏰ *Lembrete de Sessão*

Olá {{nome}}! Sua sessão começa em 30 minutos.

🕐 *Horário:* {{horario}}

Prepare-se! Nos vemos em breve. 🚀`,
    is_active: true,
  },
  owner_notification: {
    template_type: 'owner_notification',
    message_template: `📌 *Novo Agendamento!*

Um novo agendamento foi realizado:

👤 *Cliente:* {{nome}}
📧 *Email:* {{email}}
📱 *WhatsApp:* {{telefone}}
📅 *Data:* {{data}}
🕐 *Horário:* {{horario}}
{{observacoes}}`,
    is_active: true,
  },
};

export function BookingReminderTemplates() {
  const [templates, setTemplates] = useState<Record<string, ReminderTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_reminder_templates')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      const loadedTemplates: Record<string, ReminderTemplate> = { ...defaultTemplates };
      
      data?.forEach((template: any) => {
        loadedTemplates[template.template_type] = {
          id: template.id,
          template_type: template.template_type,
          message_template: template.message_template,
          is_active: template.is_active,
        };
      });

      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateType: string) => {
    if (!user) return;

    setSaving(true);
    try {
      const template = templates[templateType];
      
      if (template.id) {
        const { error } = await supabase
          .from('booking_reminder_templates')
          .update({
            message_template: template.message_template,
            is_active: template.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('booking_reminder_templates')
          .insert({
            user_id: user.id,
            template_type: templateType,
            message_template: template.message_template,
            is_active: template.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        
        setTemplates(prev => ({
          ...prev,
          [templateType]: { ...prev[templateType], id: data.id },
        }));
      }

      toast({
        title: "Template salvo",
        description: "O template de mensagem foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (templateType: string, field: keyof ReminderTemplate, value: any) => {
    setTemplates(prev => ({
      ...prev,
      [templateType]: { ...prev[templateType], [field]: value },
    }));
  };

  const templateLabels: Record<string, { title: string; description: string }> = {
    booking_confirmation: {
      title: "Confirmação de Agendamento",
      description: "Enviada automaticamente quando alguém agenda uma sessão",
    },
    reminder_30min: {
      title: "Lembrete 30 minutos antes",
      description: "Enviada 30 minutos antes da sessão começar",
    },
    owner_notification: {
      title: "Notificação para você",
      description: "Você recebe quando alguém agenda uma sessão",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Carregando templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Use as variáveis abaixo nos seus templates:
          <br />
          <code className="text-xs">{"{{nome}}"}</code> - Nome do cliente |{" "}
          <code className="text-xs">{"{{email}}"}</code> - Email |{" "}
          <code className="text-xs">{"{{telefone}}"}</code> - Telefone |{" "}
          <code className="text-xs">{"{{data}}"}</code> - Data |{" "}
          <code className="text-xs">{"{{horario}}"}</code> - Horário |{" "}
          <code className="text-xs">{"{{observacoes}}"}</code> - Observações
        </AlertDescription>
      </Alert>

      {Object.entries(templateLabels).map(([type, label]) => (
        <Card key={type}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {label.title}
                </CardTitle>
                <CardDescription>{label.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${type}`}>Ativo</Label>
                <Switch
                  id={`active-${type}`}
                  checked={templates[type]?.is_active ?? true}
                  onCheckedChange={(checked) => updateTemplate(type, 'is_active', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={templates[type]?.message_template ?? defaultTemplates[type].message_template}
                onChange={(e) => updateTemplate(type, 'message_template', e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <Button 
              onClick={() => handleSaveTemplate(type)} 
              disabled={saving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
