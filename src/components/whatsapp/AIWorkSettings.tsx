import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Briefcase, HeadphonesIcon, ShoppingCart, UserCircle } from "lucide-react";
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig";
import { cn } from "@/lib/utils";

const purposes = [
  {
    value: "suporte",
    label: "Suporte",
    description: "Use essa opção sempre que o objetivo do seu agente for prestar suporte.",
    icon: HeadphonesIcon,
  },
  {
    value: "vendas",
    label: "Vendas",
    description: "Use sempre que quiser criar um agente de no setor de vendas.",
    icon: ShoppingCart,
  },
  {
    value: "uso_pessoal",
    label: "Uso pessoal",
    description: "Escolha esta opção caso queira um agente para uso pessoal.",
    icon: UserCircle,
  },
];

export function AIWorkSettings() {
  const { config, loading, updateConfig } = useAIAssistantConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    purpose: "suporte" as "suporte" | "vendas" | "uso_pessoal",
    company_name: "",
    company_description: "",
    website_url: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        purpose: config.purpose,
        company_name: config.company_name || "",
        company_description: config.company_description || "",
        website_url: config.website_url || "",
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
          <Briefcase className="w-5 h-5" />
          Informações sobre Trabalho
        </CardTitle>
        <CardDescription>
          Configure a finalidade e informações do negócio que o assistente representa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Finalidade</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {purposes.map((purpose) => (
              <button
                key={purpose.value}
                type="button"
                onClick={() => setFormData({ ...formData, purpose: purpose.value as any })}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all",
                  formData.purpose === purpose.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <purpose.icon className={cn(
                    "w-5 h-5",
                    formData.purpose === purpose.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">{purpose.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{purpose.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">Presta suporte para</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Nome da empresa ou produto"
              maxLength={50}
            />
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                {formData.company_name.length}/50
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">Site oficial (opcional)</Label>
            <Input
              id="website_url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://minhaempresa.com.br"
              type="url"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="company_description">
              Descreva um pouco sobre {formData.company_name || "sua empresa"}
            </Label>
            <span className="text-xs text-muted-foreground">
              {formData.company_description.length}/500
            </span>
          </div>
          <Textarea
            id="company_description"
            value={formData.company_description}
            onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
            placeholder="Descreva o que sua empresa faz, quais produtos/serviços oferece..."
            className="min-h-[120px]"
            maxLength={500}
          />
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
