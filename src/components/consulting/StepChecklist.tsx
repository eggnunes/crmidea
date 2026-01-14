import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  Upload, 
  X, 
  Loader2,
  Link,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChecklistState {
  copiouPrompt: boolean;
  colou: boolean;
  aguardouGeracao: boolean;
  verificouFuncionalidades: boolean;
  testouFuncionalidades: boolean;
}

interface StepChecklistProps {
  etapaId: number;
  clientId: string;
  isCompleted: boolean;
  onChecklistComplete: (isComplete: boolean) => void;
  onMarkComplete: () => void;
  savedChecklist?: ChecklistState;
  savedScreenshotUrl?: string;
  onSaveChecklist: (checklist: ChecklistState, screenshotUrl?: string) => void;
}

const DEFAULT_CHECKLIST: ChecklistState = {
  copiouPrompt: false,
  colou: false,
  aguardouGeracao: false,
  verificouFuncionalidades: false,
  testouFuncionalidades: false,
};

const CHECKLIST_ITEMS = [
  { key: 'copiouPrompt', label: 'Copiei o prompt' },
  { key: 'colou', label: 'Colei no Lovable e cliquei em "Generate"' },
  { key: 'aguardouGeracao', label: 'Aguardei a geração completa (2-5 min)' },
  { key: 'verificouFuncionalidades', label: 'Verifiquei se as funcionalidades apareceram' },
  { key: 'testouFuncionalidades', label: 'Testei as funcionalidades básicas' },
] as const;

export function StepChecklist({
  etapaId,
  clientId,
  isCompleted,
  onChecklistComplete,
  onMarkComplete,
  savedChecklist,
  savedScreenshotUrl,
  onSaveChecklist,
}: StepChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistState>(
    savedChecklist || DEFAULT_CHECKLIST
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(
    savedScreenshotUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allChecked = Object.values(checklist).every(Boolean);

  const handleChecklistChange = (key: keyof ChecklistState, checked: boolean) => {
    const newChecklist = { ...checklist, [key]: checked };
    setChecklist(newChecklist);
    
    const isComplete = Object.values(newChecklist).every(Boolean);
    onChecklistComplete(isComplete);
    onSaveChecklist(newChecklist, screenshotUrl || undefined);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de arquivo inválido", {
        description: "Apenas PNG, JPG e WebP são aceitos."
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 5MB."
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${etapaId}-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('implementation-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('implementation-screenshots')
        .getPublicUrl(fileName);

      setScreenshotUrl(publicUrl);
      onSaveChecklist(checklist, publicUrl);
      toast.success("Screenshot enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading screenshot:", error);
      toast.error("Erro ao enviar screenshot");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeScreenshot = async () => {
    if (!screenshotUrl) return;

    try {
      // Extract file path from URL
      const urlParts = screenshotUrl.split('/implementation-screenshots/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('implementation-screenshots')
          .remove([filePath]);
      }

      setScreenshotUrl(null);
      onSaveChecklist(checklist, undefined);
      toast.success("Screenshot removido");
    } catch (error) {
      console.error("Error removing screenshot:", error);
      toast.error("Erro ao remover screenshot");
    }
  };

  const handleMarkComplete = () => {
    if (!allChecked) {
      toast.error("Complete todos os itens do checklist", {
        description: "Você precisa validar todos os passos antes de marcar como concluída."
      });
      return;
    }
    onMarkComplete();
  };

  if (isCompleted) {
    return (
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Etapa concluída!</span>
        </div>
        
        {screenshotUrl && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Screenshot da implementação:</Label>
            <a 
              href={screenshotUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <img 
                src={screenshotUrl} 
                alt="Screenshot da implementação" 
                className="max-w-[300px] rounded-lg border shadow-sm hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Checklist Header */}
      <div>
        <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
          📋 CHECKLIST DE VALIDAÇÃO:
        </h4>
        <p className="text-xs text-muted-foreground">
          Antes de marcar como concluída, verifique:
        </p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
        {CHECKLIST_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <Checkbox
              id={`check-${etapaId}-${key}`}
              checked={checklist[key]}
              onCheckedChange={(checked) => 
                handleChecklistChange(key, checked as boolean)
              }
            />
            <label 
              htmlFor={`check-${etapaId}-${key}`}
              className={`text-sm cursor-pointer ${
                checklist[key] ? 'text-green-700 dark:text-green-400 line-through' : ''
              }`}
            >
              {label}
            </label>
          </div>
        ))}
      </div>

      {/* Screenshot Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <ImageIcon className="w-4 h-4" />
          Screenshot da implementação (opcional):
        </Label>
        
        {screenshotUrl ? (
          <div className="relative inline-block">
            <img 
              src={screenshotUrl} 
              alt="Screenshot" 
              className="max-w-[200px] rounded-lg border shadow-sm"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
              onClick={removeScreenshot}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              id={`screenshot-${etapaId}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Fazer upload
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG ou WebP (máx. 5MB)
            </p>
          </div>
        )}
      </div>

      {/* Encouragement message when all checked */}
      {allChecked && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Ótimo trabalho! Pronto para marcar como concluída? 🎉
          </p>
        </div>
      )}

      {/* Mark as complete button */}
      <Button
        onClick={handleMarkComplete}
        disabled={!allChecked}
        className={`w-full gap-2 transition-all ${
          allChecked 
            ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
            : ''
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        {allChecked ? '✅ Marcar etapa como concluída' : 'Complete o checklist para continuar'}
      </Button>

      {!allChecked && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Marque todos os itens do checklist para habilitar este botão
        </p>
      )}
    </div>
  );
}
