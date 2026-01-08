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

// Função para formatar telefone com máscara
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.slice(0, 11);
  
  if (limited.length <= 2) {
    return limited.length > 0 ? `(${limited}` : "";
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

// Função para formatar CPF: XXX.XXX.XXX-XX
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

// Função para formatar CNPJ: XX.XXX.XXX/XXXX-XX
const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 14);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
};

// Função para formatar CPF ou CNPJ automaticamente
const formatCpfCnpj = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return formatCPF(numbers);
  } else {
    return formatCNPJ(numbers);
  }
};

// Validar CPF
const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(numbers.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

// Validar CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, "");
  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  let size = numbers.length - 2;
  let nums = numbers.substring(0, size);
  const digits = numbers.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  nums = numbers.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

// Validar CPF ou CNPJ
export const validateCpfCnpj = (value: string): { valid: boolean; type: 'cpf' | 'cnpj' | null } => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length === 0) return { valid: true, type: null }; // Campo opcional
  if (numbers.length === 11) return { valid: validateCPF(numbers), type: 'cpf' };
  if (numbers.length === 14) return { valid: validateCNPJ(numbers), type: 'cnpj' };
  return { valid: false, type: null };
};

// Formatar número da OAB: XXXXXX/UF
const formatOAB = (value: string): string => {
  // Separa números e letras
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const numbers = cleaned.replace(/[A-Z]/g, "").slice(0, 6);
  const letters = cleaned.replace(/[0-9]/g, "").slice(0, 2);
  
  if (numbers && letters) {
    return `${numbers}/${letters}`;
  } else if (numbers) {
    return numbers;
  }
  return "";
};

// Validar OAB básico (6 dígitos + barra + 2 letras de UF)
export const validateOAB = (value: string): boolean => {
  if (!value) return true; // Campo opcional
  const regex = /^\d{1,6}\/[A-Z]{2}$/;
  return regex.test(value);
};

export function DiagnosticStep1({ formData, updateFormData, consultantId }: DiagnosticStep1Props) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [cpfCnpjError, setCpfCnpjError] = useState<string | null>(null);
  const [oabError, setOabError] = useState<string | null>(null);
  
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateFormData({ phone: formatted });
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value);
    updateFormData({ cpf_cnpj: formatted });
    
    // Validar quando completo
    const numbers = formatted.replace(/\D/g, "");
    if (numbers.length === 11 || numbers.length === 14) {
      const result = validateCpfCnpj(formatted);
      if (!result.valid) {
        setCpfCnpjError(`${result.type === 'cpf' ? 'CPF' : 'CNPJ'} inválido`);
      } else {
        setCpfCnpjError(null);
      }
    } else if (numbers.length > 0 && numbers.length < 11) {
      setCpfCnpjError(null); // Ainda digitando
    } else {
      setCpfCnpjError(null);
    }
  };

  const handleOabChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Permite números, letras e barra
    const cleaned = value.replace(/[^A-Z0-9/]/g, "");
    
    // Formata automaticamente
    const numbers = cleaned.replace(/[^0-9]/g, "").slice(0, 6);
    const letters = cleaned.replace(/[^A-Z]/g, "").slice(0, 2);
    
    let formatted = numbers;
    if (numbers.length >= 1 && letters.length > 0) {
      formatted = `${numbers}/${letters}`;
    } else if (cleaned.includes("/")) {
      formatted = `${numbers}/`;
    }
    
    updateFormData({ oab_number: formatted });
    
    // Validar
    if (formatted && formatted.includes("/")) {
      if (!validateOAB(formatted)) {
        setOabError("Formato inválido. Use: XXXXXX/UF");
      } else {
        setOabError(null);
      }
    } else {
      setOabError(null);
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
          <Label htmlFor="full_name">Nome Completo <span className="text-destructive">*</span></Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData({ full_name: e.target.value })}
            placeholder="Seu nome completo"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
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
          <Label htmlFor="phone">Telefone/WhatsApp <span className="text-destructive">*</span></Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-9999"
            maxLength={15}
            required
          />
          <p className="text-xs text-muted-foreground">Formato: (XX) XXXXX-XXXX</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
          <Input
            id="cpf_cnpj"
            value={formData.cpf_cnpj}
            onChange={handleCpfCnpjChange}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            maxLength={18}
            className={cpfCnpjError ? "border-destructive" : ""}
          />
          {cpfCnpjError ? (
            <p className="text-xs text-destructive">{cpfCnpjError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Opcional - CPF ou CNPJ do responsável/escritório</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="oab_number">Número da OAB</Label>
          <Input
            id="oab_number"
            value={formData.oab_number}
            onChange={handleOabChange}
            placeholder="123456/SP"
            maxLength={9}
            className={oabError ? "border-destructive" : ""}
          />
          {oabError ? (
            <p className="text-xs text-destructive">{oabError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Formato: XXXXXX/UF (opcional)</p>
          )}
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
          <Label htmlFor="office_name">Nome do Escritório <span className="text-destructive">*</span></Label>
          <Input
            id="office_name"
            value={formData.office_name}
            onChange={(e) => updateFormData({ office_name: e.target.value })}
            placeholder="Nome do seu escritório de advocacia"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="office_address">Endereço do Escritório <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="foundation_year">Ano de Fundação <span className="text-destructive">*</span></Label>
            <Input
              id="foundation_year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.foundation_year || ""}
              onChange={(e) => updateFormData({ foundation_year: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="2020"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="num_lawyers">Nº de Advogados <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="num_employees">Total de Colaboradores <span className="text-destructive">*</span></Label>
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
          <Label htmlFor="practice_areas">Áreas de Atuação <span className="text-destructive">*</span></Label>
          <Textarea
            id="practice_areas"
            value={formData.practice_areas}
            onChange={(e) => updateFormData({ practice_areas: e.target.value })}
            placeholder="Ex: Direito Civil, Trabalhista, Empresarial, Família..."
            rows={3}
            required
          />
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        <span className="text-destructive">*</span> Campos obrigatórios
      </p>
    </div>
  );
}
