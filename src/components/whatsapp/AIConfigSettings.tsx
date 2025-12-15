import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Settings2 } from "lucide-react";
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig";

const settings = [
  {
    key: "use_emojis",
    label: "Usar Emojis Nas Respostas",
    description: "Define se o agente pode utilizar emojis em suas respostas.",
    icon: "😊",
  },
  {
    key: "sign_agent_name",
    label: "Assinar nome do agente nas respostas",
    description: "Ative esta opção para que o agente de IA adicione automaticamente sua assinatura em cada resposta enviada ao usuário.",
    icon: "✍️",
  },
  {
    key: "restrict_topics",
    label: "Restringir Temas Permitidos",
    description: "Marque essa opção para que o agente não fale sobre outros assuntos.",
    icon: "🎯",
  },
  {
    key: "split_long_messages",
    label: "Dividir resposta em partes",
    description: "Em caso da mensagem ficar grande, o agente pode separar em várias mensagens.",
    icon: "📝",
  },
  {
    key: "allow_reminders",
    label: "Permitir registrar lembretes",
    description: "Habilite essa opção para que o agente tenha a capacidade de registrar lembretes ao usuário.",
    icon: "🔔",
  },
  {
    key: "smart_training_search",
    label: "Busca inteligente do treinamento",
    description: "O agente consulta a base de treinamentos no momento certo, para trazer respostas mais precisas.",
    icon: "🧠",
    beta: true,
  },
];

export function AIConfigSettings() {
  const { config, loading, updateConfig } = useAIAssistantConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    use_emojis: true,
    sign_agent_name: false,
    restrict_topics: true,
    split_long_messages: true,
    allow_reminders: true,
    smart_training_search: true,
    is_active: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        use_emojis: config.use_emojis,
        sign_agent_name: config.sign_agent_name,
        restrict_topics: config.restrict_topics,
        split_long_messages: config.split_long_messages,
        allow_reminders: config.allow_reminders,
        smart_training_search: config.smart_training_search,
        is_active: config.is_active,
      });
    }
  }, [config]);

  const handleToggle = (key: string, value: boolean) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    await updateConfig(formData);
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Preferências da Conversa
        </CardTitle>
        <CardDescription>
          Configure como o assistente deve se comportar durante as conversas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle for AI */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="space-y-1">
            <Label className="text-base font-medium">Assistente de IA Ativo</Label>
            <p className="text-sm text-muted-foreground">
              Ative ou desative o assistente de IA para responder automaticamente às mensagens
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => handleToggle("is_active", checked)}
          />
        </div>

        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{setting.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{setting.label}</Label>
                    {setting.beta && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                        Beta
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              <Switch
                checked={formData[setting.key as keyof typeof formData] as boolean}
                onCheckedChange={(checked) => handleToggle(setting.key, checked)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
