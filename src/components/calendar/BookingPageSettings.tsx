import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Save, Link2, Copy, ExternalLink, Loader2 } from "lucide-react";

interface BookingSettings {
  id?: string;
  title: string;
  description: string;
}

export function BookingPageSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BookingSettings>({
    title: "Agende sua Sessão",
    description: "Selecione um horário disponível para nossa mentoria. Estou ansioso para ajudá-lo em sua jornada!"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("booking_page_settings" as any)
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          id: (data as any).id,
          title: (data as any).title,
          description: (data as any).description || ""
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from("booking_page_settings" as any)
          .update({
            title: settings.title,
            description: settings.description
          } as any)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("booking_page_settings" as any)
          .insert({
            user_id: user.id,
            title: settings.title,
            description: settings.description
          } as any)
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: (data as any).id }));
      }
      
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const getPublicUrl = () => {
    return `${window.location.origin}/agendar/${user?.id}`;
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(getPublicUrl());
    toast.success("Link copiado para a área de transferência!");
  };

  const openPublicPage = () => {
    window.open(getPublicUrl(), "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Página Pública de Agendamento
          </CardTitle>
          <CardDescription>
            Personalize a aparência da sua página de agendamento público
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Página</Label>
            <Input
              id="title"
              placeholder="Ex: Mentoria & Consultoria"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente o serviço oferecido..."
              rows={3}
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link Público</CardTitle>
          <CardDescription>
            Compartilhe este link para que pessoas possam agendar sessões com você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={getPublicUrl()}
              readOnly
              className="bg-muted"
            />
            <Button variant="outline" size="icon" onClick={copyPublicUrl}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={openPublicPage}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Este link mostrará seus horários disponíveis com o título e descrição configurados acima.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
