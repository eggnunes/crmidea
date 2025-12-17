import { useState } from "react";
import { useWelcomeTemplates } from "@/hooks/useWelcomeTemplates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const productTypes = [
  { key: "consultoria", label: "Consultoria", emoji: "🎯" },
  { key: "mentoria_coletiva", label: "Mentoria Coletiva", emoji: "🌟" },
  { key: "mentoria_individual", label: "Mentoria Individual", emoji: "🌟" },
  { key: "curso_idea", label: "Curso IDEA", emoji: "🎉" },
  { key: "guia_ia", label: "Guia IA", emoji: "📖" },
  { key: "codigo_prompts", label: "Código Prompts", emoji: "🔑" },
  { key: "combo_ebooks", label: "Combo E-books", emoji: "📚" },
];

export function WelcomeTemplatesManager() {
  const { templates, loading, saveTemplate, getTemplate, defaultTemplates } = useWelcomeTemplates();
  const [editedTemplates, setEditedTemplates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (productType: string, value: string) => {
    setEditedTemplates(prev => ({ ...prev, [productType]: value }));
  };

  const handleSave = async (productType: string) => {
    setSaving(productType);
    const templateToSave = editedTemplates[productType] ?? getTemplate(productType);
    await saveTemplate(productType, templateToSave);
    setSaving(null);
  };

  const handleReset = (productType: string) => {
    setEditedTemplates(prev => ({ ...prev, [productType]: defaultTemplates[productType] }));
    toast({
      title: "Template restaurado",
      description: "O template padrão foi restaurado. Clique em Salvar para confirmar.",
    });
  };

  const getDisplayValue = (productType: string) => {
    if (productType in editedTemplates) {
      return editedTemplates[productType];
    }
    return getTemplate(productType);
  };

  if (loading) {
    return <div className="text-muted-foreground">Carregando templates...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Templates de Boas-vindas
        </CardTitle>
        <CardDescription>
          Personalize as mensagens automáticas enviadas quando um cliente compra cada produto.
          Use {"{{nome}}"} para inserir o nome do cliente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="consultoria">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            {productTypes.map((product) => (
              <TabsTrigger key={product.key} value={product.key} className="text-xs">
                {product.emoji} {product.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {productTypes.map((product) => (
            <TabsContent key={product.key} value={product.key}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{product.emoji} {product.label}</Badge>
                    {templates.find(t => t.product_type === product.key) && (
                      <Badge variant="secondary">Personalizado</Badge>
                    )}
                  </div>
                </div>

                <Textarea
                  value={getDisplayValue(product.key)}
                  onChange={(e) => handleChange(product.key, e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Digite o template da mensagem..."
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSave(product.key)}
                    disabled={saving === product.key}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving === product.key ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleReset(product.key)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: {"{{nome}}"} - nome do cliente
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
