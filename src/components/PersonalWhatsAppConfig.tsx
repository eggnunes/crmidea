import { useState, useEffect } from "react";
import { useFollowUpSettings } from "@/hooks/useFollowUpSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Save, Check } from "lucide-react";

export function PersonalWhatsAppConfig() {
  const { settings, loading, saveSettings } = useFollowUpSettings();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.personal_whatsapp) {
      setPhone(settings.personal_whatsapp);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({ 
      ...settings,
      personal_whatsapp: phone 
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          WhatsApp Pessoal para Alertas
        </CardTitle>
        <CardDescription>
          Configure seu número pessoal para receber alertas de transferência quando um cliente digitar "falar com Rafael".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="personal_whatsapp">Número do WhatsApp</Label>
          <div className="flex gap-2">
            <Input
              id="personal_whatsapp"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="max-w-xs"
            />
            <Button onClick={handleSave} disabled={saving || loading}>
              {saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvo
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar"}
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Você receberá uma mensagem neste número quando alguém solicitar transferência para atendimento humano.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
