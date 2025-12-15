import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig";
import { Loader2, Save, Clock, Users, Mic, Calendar, MessageCircle, Volume2 } from "lucide-react";

export function AdvancedSettings() {
  const { config, loading, updateConfig } = useAIAssistantConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    inactivity_timeout_minutes: 30,
    inactivity_action: "none",
    inactivity_message: "",
    elevenlabs_enabled: false,
    elevenlabs_voice_id: "",
    google_calendar_enabled: false,
    google_calendar_id: "",
    show_typing_indicator: true,
    show_recording_indicator: true,
    response_delay_seconds: 2,
    disable_group_messages: true,
    auto_create_contacts: true,
    voice_response_enabled: false,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        inactivity_timeout_minutes: (config as any).inactivity_timeout_minutes || 30,
        inactivity_action: (config as any).inactivity_action || "none",
        inactivity_message: (config as any).inactivity_message || "",
        elevenlabs_enabled: (config as any).elevenlabs_enabled || false,
        elevenlabs_voice_id: (config as any).elevenlabs_voice_id || "",
        google_calendar_enabled: (config as any).google_calendar_enabled || false,
        google_calendar_id: (config as any).google_calendar_id || "",
        show_typing_indicator: (config as any).show_typing_indicator ?? true,
        show_recording_indicator: (config as any).show_recording_indicator ?? true,
        response_delay_seconds: (config as any).response_delay_seconds || 2,
        disable_group_messages: (config as any).disable_group_messages ?? true,
        auto_create_contacts: (config as any).auto_create_contacts ?? true,
        voice_response_enabled: (config as any).voice_response_enabled || false,
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await updateConfig(formData as any);
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
    <div className="space-y-6">
      {/* Response Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comportamento de Resposta
          </CardTitle>
          <CardDescription>
            Configure como a IA deve responder às mensagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mostrar "digitando..."</Label>
                <p className="text-sm text-muted-foreground">
                  Exibe o indicador de digitação antes de enviar a resposta
                </p>
              </div>
              <Switch
                checked={formData.show_typing_indicator}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_typing_indicator: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mostrar "gravando áudio..."</Label>
                <p className="text-sm text-muted-foreground">
                  Exibe o indicador de gravação ao responder com áudio
                </p>
              </div>
              <Switch
                checked={formData.show_recording_indicator}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_recording_indicator: checked })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tempo de resposta: {formData.response_delay_seconds}s</Label>
              </div>
              <Slider
                value={[formData.response_delay_seconds]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, response_delay_seconds: value })
                }
                min={0}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Aguarda esse tempo antes de começar a responder (simula digitação humana)
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Desativar para grupos</Label>
              <p className="text-sm text-muted-foreground">
                A IA não responde mensagens em grupos
              </p>
            </div>
            <Switch
              checked={formData.disable_group_messages}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, disable_group_messages: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Criar contatos automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Salva automaticamente novos contatos que enviam mensagem
              </p>
            </div>
            <Switch
              checked={formData.auto_create_contacts}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_create_contacts: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Inactivity Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Ações de Inatividade
          </CardTitle>
          <CardDescription>
            Configure o que acontece quando o usuário fica inativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tempo de inatividade (minutos)</Label>
              <Input
                type="number"
                value={formData.inactivity_timeout_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inactivity_timeout_minutes: parseInt(e.target.value) || 30,
                  })
                }
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select
                value={formData.inactivity_action}
                onValueChange={(value) =>
                  setFormData({ ...formData, inactivity_action: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma ação</SelectItem>
                  <SelectItem value="send_message">Enviar mensagem</SelectItem>
                  <SelectItem value="end_conversation">Encerrar conversa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.inactivity_action === "send_message" && (
            <div className="space-y-2">
              <Label>Mensagem de inatividade</Label>
              <Textarea
                value={formData.inactivity_message}
                onChange={(e) =>
                  setFormData({ ...formData, inactivity_message: e.target.value })
                }
                placeholder="Olá! Notei que você ficou ausente. Posso ajudar em algo mais?"
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Integration (ElevenLabs) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Integração de Voz (ElevenLabs)
          </CardTitle>
          <CardDescription>
            Configure respostas em áudio usando sua voz clonada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Ativar respostas por áudio</Label>
              <p className="text-sm text-muted-foreground">
                A IA responde com áudio quando recebe uma mensagem de áudio
              </p>
            </div>
            <Switch
              checked={formData.voice_response_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, voice_response_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Usar ElevenLabs</Label>
              <p className="text-sm text-muted-foreground">
                Use sua voz clonada no ElevenLabs para respostas
              </p>
            </div>
            <Switch
              checked={formData.elevenlabs_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, elevenlabs_enabled: checked })
              }
            />
          </div>

          {formData.elevenlabs_enabled && (
            <div className="space-y-2">
              <Label>Voice ID do ElevenLabs</Label>
              <Input
                value={formData.elevenlabs_voice_id}
                onChange={(e) =>
                  setFormData({ ...formData, elevenlabs_voice_id: e.target.value })
                }
                placeholder="Seu Voice ID do ElevenLabs"
              />
              <p className="text-xs text-muted-foreground">
                Encontre seu Voice ID no painel do ElevenLabs após clonar sua voz
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Integração com Google Calendar
          </CardTitle>
          <CardDescription>
            Permita que a IA agende compromissos no seu calendário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Ativar Google Calendar</Label>
              <p className="text-sm text-muted-foreground">
                A IA pode criar eventos e verificar disponibilidade
              </p>
            </div>
            <Switch
              checked={formData.google_calendar_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, google_calendar_enabled: checked })
              }
            />
          </div>

          {formData.google_calendar_enabled && (
            <div className="space-y-2">
              <Label>ID do Calendário</Label>
              <Input
                value={formData.google_calendar_id}
                onChange={(e) =>
                  setFormData({ ...formData, google_calendar_id: e.target.value })
                }
                placeholder="seu-email@gmail.com ou ID do calendário"
              />
              <p className="text-xs text-muted-foreground">
                Configure a API Key do Google Calendar nos secrets do projeto
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
