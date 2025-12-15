import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Save, User } from "lucide-react";
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig";

export function AIProfileSettings() {
  const { config, loading, updateConfig } = useAIAssistantConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: "",
    communication_style: "descontraida" as "formal" | "normal" | "descontraida",
    behavior_prompt: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        agent_name: config.agent_name,
        communication_style: config.communication_style,
        behavior_prompt: config.behavior_prompt || "",
      });
    }
  }, [config]);

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
          <User className="w-5 h-5" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>
          Configure o perfil e personalidade do seu assistente de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent_name">Nome do agente</Label>
            <Input
              id="agent_name"
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              placeholder="Ex: IDEA - Inteligência de Dados e Artificial"
            />
          </div>
          <div className="space-y-2">
            <Label>Comunicação</Label>
            <ToggleGroup
              type="single"
              value={formData.communication_style}
              onValueChange={(value) =>
                value && setFormData({ ...formData, communication_style: value as any })
              }
              className="justify-start"
            >
              <ToggleGroupItem value="formal" className="px-4">
                Formal
              </ToggleGroupItem>
              <ToggleGroupItem value="normal" className="px-4">
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem value="descontraida" className="px-4">
                Descontraída
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="behavior_prompt">Comportamento</Label>
            <span className="text-xs text-muted-foreground">
              {formData.behavior_prompt.length}/3000
            </span>
          </div>
          <Textarea
            id="behavior_prompt"
            value={formData.behavior_prompt}
            onChange={(e) => setFormData({ ...formData, behavior_prompt: e.target.value })}
            placeholder="Descreva um pouco sobre como o agente deve se comportar durante a conversa..."
            className="min-h-[200px]"
            maxLength={3000}
          />
          <p className="text-xs text-muted-foreground">
            Descreva a personalidade, tom de voz e como o assistente deve interagir com os usuários.
            Use ** para destacar palavras importantes.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
