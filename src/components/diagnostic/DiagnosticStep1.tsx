import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Sparkles, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep1Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
  consultantId?: string;
}

export function DiagnosticStep1({ formData, updateFormData, consultantId }: DiagnosticStep1Props) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }
    
    setIsUploadingLogo(true);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${consultantId || "public"}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("consulting-logos")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("consulting-logos")
        .getPublicUrl(filePath);
      
      updateFormData({ logo_url: publicUrl });
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erro ao enviar logo. Tente novamente.");
    } finally {
      setIsUploadingLogo(false);
    }
  };
  
  const handleGenerateLogo = async () => {
    if (!formData.office_name.trim()) {
      toast.error("Preencha o nome do escritório para gerar o logo");
      return;
    }
    
    setIsGeneratingLogo(true);
    
    try {
      const response = await supabase.functions.invoke("generate-logo", {
        body: {
          office_name: formData.office_name,
          practice_areas: formData.practice_areas,
        },
      });
      
      if (response.error) throw response.error;
      
      if (response.data?.logo_url) {
        updateFormData({ logo_url: response.data.logo_url });
        toast.success("Logo gerado com sucesso!");
      }
    } catch (error) {
      console.error("Error generating logo:", error);
      toast.error("Erro ao gerar logo. Tente novamente.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg bg-muted/30">
        <Avatar className="w-24 h-24">
          <AvatarImage src={formData.logo_url || undefined} />
          <AvatarFallback className="bg-primary/10">
            <Building2 className="w-10 h-10 text-primary" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploadingLogo}
            onClick={() => document.getElementById("logo-upload")?.click()}
          >
            {isUploadingLogo ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Enviar Logo
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isGeneratingLogo || !formData.office_name}
            onClick={handleGenerateLogo}
          >
            {isGeneratingLogo ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar com IA
          </Button>
        </div>
        
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
        
        <p className="text-xs text-muted-foreground text-center">
          Envie sua logomarca ou gere uma com IA (opcional)
        </p>
      </div>
      
      {/* Personal Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData({ full_name: e.target.value })}
            placeholder="Seu nome completo"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone/WhatsApp *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="(11) 99999-9999"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="www.seuescritorio.com.br"
          />
        </div>
      </div>
      
      {/* Office Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="office_name">Nome do Escritório *</Label>
          <Input
            id="office_name"
            value={formData.office_name}
            onChange={(e) => updateFormData({ office_name: e.target.value })}
            placeholder="Nome do seu escritório de advocacia"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="office_address">Endereço do Escritório *</Label>
          <Input
            id="office_address"
            value={formData.office_address}
            onChange={(e) => updateFormData({ office_address: e.target.value })}
            placeholder="Endereço completo"
            required
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="foundation_year">Ano de Fundação</Label>
            <Input
              id="foundation_year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.foundation_year || ""}
              onChange={(e) => updateFormData({ foundation_year: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="2020"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="num_lawyers">Nº de Advogados *</Label>
            <Input
              id="num_lawyers"
              type="number"
              min="1"
              value={formData.num_lawyers}
              onChange={(e) => updateFormData({ num_lawyers: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="num_employees">Total de Colaboradores *</Label>
            <Input
              id="num_employees"
              type="number"
              min="1"
              value={formData.num_employees}
              onChange={(e) => updateFormData({ num_employees: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="practice_areas">Áreas de Atuação</Label>
          <Textarea
            id="practice_areas"
            value={formData.practice_areas}
            onChange={(e) => updateFormData({ practice_areas: e.target.value })}
            placeholder="Ex: Direito Civil, Trabalhista, Empresarial, Família..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
