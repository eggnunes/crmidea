import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig";
import { Loader2, Save, Clock, Mic, Calendar, MessageCircle, Volume2, Plus, Trash2 } from "lucide-react";

interface InactivityAction {
  timeout: number;
  unit: "minutes" | "hours" | "days";
  action: string;
  message: string;
}

export function AdvancedSettings() {
  const { config, loading, updateConfig } = useAIAssistantConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    elevenlabs_enabled: false,
    elevenlabs_voice_id: "",
    google_calendar_enabled: false,
    google_calendar_id: "",
    show_typing_indicator: true,
    show_recording_indicator: true,
    response_delay_seconds: 2,
    response_delay_unit: "seconds" as "seconds" | "minutes",
    disable_group_messages: true,
    auto_create_contacts: true,
    voice_response_enabled: false,
  });
  
  const [inactivityActions, setInactivityActions] = useState<InactivityAction[]>([
    { timeout: 30, unit: "minutes", action: "none", message: "" }
  ]);

  useEffect(() => {
    if (config) {
      const configAny = config as any;
      
      // Parse response delay
      let responseDelaySeconds = configAny.response_delay_seconds || 2;
      let responseDelayUnit: "seconds" | "minutes" = "seconds";
      if (responseDelaySeconds >= 60) {
        responseDelaySeconds = Math.floor(responseDelaySeconds / 60);
        responseDelayUnit = "minutes";
      }
      
      setFormData({
        elevenlabs_enabled: configAny.elevenlabs_enabled || false,
        elevenlabs_voice_id: configAny.elevenlabs_voice_id || "",
        google_calendar_enabled: configAny.google_calendar_enabled || false,
        google_calendar_id: configAny.google_calendar_id || "",
        show_typing_indicator: configAny.show_typing_indicator ?? true,
        show_recording_indicator: configAny.show_recording_indicator ?? true,
        response_delay_seconds: responseDelaySeconds,
        response_delay_unit: responseDelayUnit,
        disable_group_messages: configAny.disable_group_messages ?? true,
        auto_create_contacts: configAny.auto_create_contacts ?? true,
        voice_response_enabled: configAny.voice_response_enabled || false,
      });
      
      // Parse inactivity settings - could be stored as JSON string or single value
      const timeoutMinutes = configAny.inactivity_timeout_minutes || 30;
      const action = configAny.inactivity_action || "none";
      const message = configAny.inactivity_message || "";
      
      // Try to parse as JSON array first
      try {
        if (configAny.inactivity_message && configAny.inactivity_message.startsWith('[')) {
          const parsedActions = JSON.parse(configAny.inactivity_message);
          if (Array.isArray(parsedActions) && parsedActions.length > 0) {
            setInactivityActions(parsedActions);
            return;
          }
        }
      } catch {
        // Not JSON, use single value
      }
      
      // Convert minutes to appropriate unit
      let unit: "minutes" | "hours" | "days" = "minutes";
      let timeout = timeoutMinutes;
      if (timeoutMinutes >= 1440) {
        timeout = Math.floor(timeoutMinutes / 1440);
        unit = "days";
      } else if (timeoutMinutes >= 60) {
        timeout = Math.floor(timeoutMinutes / 60);
        unit = "hours";
      }
      
      setInactivityActions([{ timeout, unit, action, message }]);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    
    // Convert response delay to seconds
    let delayInSeconds = formData.response_delay_seconds;
    if (formData.response_delay_unit === "minutes") {
      delayInSeconds = formData.response_delay_seconds * 60;
    }
    
    // Convert first inactivity action to minutes for backward compatibility
    const firstAction = inactivityActions[0] || { timeout: 30, unit: "minutes", action: "none", message: "" };
    let timeoutMinutes = firstAction.timeout;
    if (firstAction.unit === "hours") {
      timeoutMinutes = firstAction.timeout * 60;
    } else if (firstAction.unit === "days") {
      timeoutMinutes = firstAction.timeout * 1440;
    }
    
    // Store all actions as JSON in inactivity_message if more than one
    const inactivityMessage = inactivityActions.length > 1 
      ? JSON.stringify(inactivityActions)
      : firstAction.message;
    
    await updateConfig({
      ...formData,
      response_delay_seconds: delayInSeconds,
      inactivity_timeout_minutes: timeoutMinutes,
      inactivity_action: firstAction.action,
      inactivity_message: inactivityMessage,
    } as any);
    setSaving(false);
  };

  const addInactivityAction = () => {
    setInactivityActions([...inactivityActions, { timeout: 30, unit: "minutes", action: "none", message: "" }]);
  };

  const removeInactivityAction = (index: number) => {
    if (inactivityActions.length > 1) {
      setInactivityActions(inactivityActions.filter((_, i) => i !== index));
    }
  };

  const updateInactivityAction = (index: number, field: keyof InactivityAction, value: any) => {
    const updated = [...inactivityActions];
    updated[index] = { ...updated[index], [field]: value };
    setInactivityActions(updated);
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
              <Label>Tempo de resposta</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.response_delay_seconds}
                  onChange={(e) =>
                    setFormData({ ...formData, response_delay_seconds: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  max={formData.response_delay_unit === "minutes" ? 60 : 300}
                  className="w-24"
                />
                <Select
                  value={formData.response_delay_unit}
                  onValueChange={(value: "seconds" | "minutes") =>
                    setFormData({ ...formData, response_delay_unit: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            Configure múltiplas ações quando o usuário fica inativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inactivityActions.map((action, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Ação {index + 1}</Label>
                {inactivityActions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInactivityAction(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tempo</Label>
                  <Input
                    type="number"
                    value={action.timeout}
                    onChange={(e) =>
                      updateInactivityAction(index, "timeout", parseInt(e.target.value) || 1)
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    value={action.unit}
                    onValueChange={(value: "minutes" | "hours" | "days") =>
                      updateInactivityAction(index, "unit", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                      <SelectItem value="days">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select
                    value={action.action}
                    onValueChange={(value) =>
                      updateInactivityAction(index, "action", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma ação</SelectItem>
                      <SelectItem value="send_message">Enviar mensagem</SelectItem>
                      <SelectItem value="end_conversation">Encerrar conversa</SelectItem>
                      <SelectItem value="transfer_human">Transferir para humano</SelectItem>
                      <SelectItem value="send_reminder">Enviar lembrete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(action.action === "send_message" || action.action === "send_reminder") && (
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    value={action.message}
                    onChange={(e) =>
                      updateInactivityAction(index, "message", e.target.value)
                    }
                    placeholder="Olá! Notei que você ficou ausente. Posso ajudar em algo mais?"
                    rows={2}
                  />
                </div>
              )}
            </div>
          ))}
          
          <Button variant="outline" onClick={addInactivityAction} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Ação
          </Button>
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
