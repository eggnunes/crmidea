import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DiagnosticFormData } from "@/pages/PublicDiagnosticForm";

interface DiagnosticStep3Props {
  formData: DiagnosticFormData;
  updateFormData: (updates: Partial<DiagnosticFormData>) => void;
}

export function DiagnosticStep3({ formData, updateFormData }: DiagnosticStep3Props) {
  const [isUploadingFlowchart, setIsUploadingFlowchart] = useState(false);
  const [isUploadingServiceFlowchart, setIsUploadingServiceFlowchart] = useState(false);

  const handleFileUpload = async (
    file: File,
    type: 'case_management' | 'client_service',
    setUploading: (v: boolean) => void
  ) => {
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O tamanho máximo é 10MB.");
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `diagnostic_${type}_${Date.now()}.${fileExt}`;
      const filePath = `diagnostic-attachments/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('consulting-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, show a friendly message
        if (uploadError.message.includes('Bucket not found')) {
          toast.error("Sistema de arquivos não configurado. Por favor, descreva o fluxo por texto.");
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('consulting-files')
        .getPublicUrl(filePath);

      // Update form data with file info
      if (type === 'case_management') {
        updateFormData({
          _caseManagementFlowchartUrl: publicUrl,
          _caseManagementFlowchartName: file.name
        });
      } else {
        updateFormData({
          _clientServiceFlowchartUrl: publicUrl,
          _clientServiceFlowchartName: file.name
        });
      }

      toast.success("Arquivo anexado com sucesso!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao anexar arquivo. Por favor, descreva o fluxo por texto.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (type: 'case_management' | 'client_service') => {
    if (type === 'case_management') {
      updateFormData({
        _caseManagementFlowchartUrl: null,
        _caseManagementFlowchartName: null
      });
    } else {
      updateFormData({
        _clientServiceFlowchartUrl: null,
        _clientServiceFlowchartName: null
      });
    }
    toast.success("Arquivo removido!");
  };

  return (
    <div className="space-y-6">
      {/* Case Management System - Text Input */}
      <div className="space-y-2">
        <Label htmlFor="case_management_system">
          Qual sistema de gestão processual você utiliza?
        </Label>
        <Input
          id="case_management_system"
          value={formData.case_management_system}
          onChange={(e) => updateFormData({ case_management_system: e.target.value })}
          placeholder="Ex: Projuris, Legal One, planilhas Excel, ou descreva seu sistema"
        />
      </div>
      
      {/* Case Management Flow */}
      <div className="space-y-3">
        <Label htmlFor="case_management_flow">
          Como funciona o fluxo de gestão dos seus processos atualmente?
        </Label>
        <Textarea
          id="case_management_flow"
          value={formData.case_management_flow}
          onChange={(e) => updateFormData({ case_management_flow: e.target.value })}
          placeholder="Descreva como você organiza e acompanha os processos no seu escritório: 
- Como você recebe novos casos?
- Como distribui para a equipe?
- Como acompanha prazos?
- Como gerencia documentos?"
          rows={6}
        />
        
        {/* File Attachment for Flowchart */}
        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">
            📎 Caso tenha um fluxograma do seu escritório, você pode anexá-lo aqui (opcional):
          </p>
          
          {formData._caseManagementFlowchartUrl && formData._caseManagementFlowchartName ? (
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm flex-1 truncate">{formData._caseManagementFlowchartName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile('case_management')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                id="case_management_flowchart"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'case_management', setIsUploadingFlowchart);
                }}
                disabled={isUploadingFlowchart}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('case_management_flowchart')?.click()}
                disabled={isUploadingFlowchart}
              >
                {isUploadingFlowchart ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploadingFlowchart ? "Enviando..." : "Anexar Arquivo"}
              </Button>
              <span className="text-xs text-muted-foreground">
                PDF, imagens ou documentos (máx. 10MB)
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Client Service Flow */}
      <div className="space-y-3">
        <Label htmlFor="client_service_flow">
          Como funciona o atendimento aos clientes no seu escritório?
        </Label>
        <Textarea
          id="client_service_flow"
          value={formData.client_service_flow}
          onChange={(e) => updateFormData({ client_service_flow: e.target.value })}
          placeholder="Descreva o fluxo de atendimento ao cliente:
- Como os clientes entram em contato? (WhatsApp, telefone, e-mail)
- Quem faz o primeiro atendimento?
- Como são agendadas as reuniões?
- Como vocês enviam atualizações dos processos?"
          rows={6}
        />
        
        {/* File Attachment for Service Flowchart */}
        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">
            📎 Caso tenha um fluxograma do atendimento ao cliente, você pode anexá-lo aqui (opcional):
          </p>
          
          {formData._clientServiceFlowchartUrl && formData._clientServiceFlowchartName ? (
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm flex-1 truncate">{formData._clientServiceFlowchartName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile('client_service')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                id="client_service_flowchart"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'client_service', setIsUploadingServiceFlowchart);
                }}
                disabled={isUploadingServiceFlowchart}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('client_service_flowchart')?.click()}
                disabled={isUploadingServiceFlowchart}
              >
                {isUploadingServiceFlowchart ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploadingServiceFlowchart ? "Enviando..." : "Anexar Arquivo"}
              </Button>
              <span className="text-xs text-muted-foreground">
                PDF, imagens ou documentos (máx. 10MB)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
