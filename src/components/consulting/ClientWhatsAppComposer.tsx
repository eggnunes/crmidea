import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useScheduledMessages } from "@/hooks/useScheduledMessages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalendarClock,
  Loader2,
  Mic,
  Paperclip,
  Sparkles,
  Send,
  Square,
  FileText,
} from "lucide-react";
import { ClientMessageTemplates } from "@/components/consulting/ClientMessageTemplates";

interface ClientWhatsAppComposerProps {
  clientId?: string;
  clientName: string;
  clientPhone: string;
}

function normalizePhoneToBrazilE164(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function replaceVariables(text: string, vars: { nome: string; email?: string; telefone?: string; escritorio?: string }) {
  return (text || "")
    .replace(/\{\{nome\}\}/g, vars.nome)
    .replace(/\{\{email\}\}/g, vars.email || "")
    .replace(/\{\{telefone\}\}/g, vars.telefone || "")
    .replace(/\{\{escritorio\}\}/g, vars.escritorio || vars.nome);
}

function toDateTimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ClientWhatsAppComposer({ clientId, clientName, clientPhone }: ClientWhatsAppComposerProps) {
  const { user } = useAuth();
  const { scheduleMessage } = useScheduledMessages();
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    getBase64Audio,
  } = useAudioRecorder();

  const [message, setMessage] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [sendingText, setSendingText] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string>(""); // datetime-local

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedPhone = useMemo(() => normalizePhoneToBrazilE164(clientPhone), [clientPhone]);

  useEffect(() => {
    setConversationId(null);
  }, [normalizedPhone]);

  const ensureConversation = async () => {
    if (!user) throw new Error("Você precisa estar logado para enviar mensagens.");
    if (!normalizedPhone) throw new Error("Telefone do cliente inválido.");

    if (conversationId) return conversationId;

    // Try find
    const { data: existing, error: existingError } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("contact_phone", normalizedPhone)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking conversation:", existingError);
    }

    if (existing?.id) {
      setConversationId(existing.id);
      return existing.id;
    }

    // Create
    const { data: created, error: createError } = await supabase
      .from("whatsapp_conversations")
      .insert({
        user_id: user.id,
        contact_phone: normalizedPhone,
        contact_name: clientName || null,
        unread_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) throw createError;
    setConversationId(created.id);
    return created.id;
  };

  const sendText = async () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setSendingText(true);
    try {
      const convId = await ensureConversation();
      const { data, error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          conversationId: convId,
          content: message,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao enviar mensagem");

      toast.success("Mensagem enviada via WhatsApp!");
      setMessage("");
    } catch (error) {
      console.error("Error sending WhatsApp text:", error);
      toast.error("Erro ao enviar mensagem. Verifique se o WhatsApp está conectado.");
    } finally {
      setSendingText(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Descreva a mensagem que você quer enviar");
      return;
    }

    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-whatsapp-draft", {
        body: {
          clientId,
          clientName,
          clientPhone: normalizedPhone,
          description: aiPrompt,
        },
      });
      if (error) throw error;
      if (!data?.message) throw new Error(data?.error || "Não foi possível gerar a mensagem");

      setMessage(String(data.message));
      toast.success("Mensagem gerada! Revise e clique em Enviar.");
      setAiOpen(false);

      if (data?.suggested_at) {
        const d = new Date(String(data.suggested_at));
        if (!Number.isNaN(d.getTime())) {
          setScheduleAt(toDateTimeLocalValue(d));
          setScheduleOpen(true);
        }
      }
    } catch (error) {
      console.error("Error generating WhatsApp draft:", error);
      toast.error("Erro ao gerar mensagem com IA");
    } finally {
      setAiGenerating(false);
    }
  };

  const sendAudio = async () => {
    if (!audioBlob) {
      toast.error("Grave um áudio primeiro");
      return;
    }

    setSendingAudio(true);
    try {
      const convId = await ensureConversation();
      const base64Audio = await getBase64Audio();
      if (!base64Audio) throw new Error("Não foi possível preparar o áudio");

      const { data, error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          conversationId: convId,
          type: "audio",
          audio: base64Audio,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao enviar áudio");

      toast.success("Áudio enviado via WhatsApp!");
      clearRecording();
    } catch (error) {
      console.error("Error sending WhatsApp audio:", error);
      toast.error("Erro ao enviar áudio.");
    } finally {
      setSendingAudio(false);
    }
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSendingFile(true);
    try {
      const convId = await ensureConversation();
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";

      if (!isImage && !isPdf) {
        throw new Error("Por enquanto, o anexo suporta apenas imagens e PDF.");
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const data = result.split(",")[1];
          if (!data) reject(new Error("Falha ao ler arquivo"));
          else resolve(data);
        };
        reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          conversationId: convId,
          type: isImage ? "image" : "document",
          ...(isImage ? { image: base64 } : { document: base64, fileName: file.name }),
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao enviar arquivo");

      toast.success("Arquivo enviado via WhatsApp!");
    } catch (error) {
      console.error("Error sending WhatsApp file:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar arquivo");
    } finally {
      setSendingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const scheduleText = async () => {
    if (!message.trim()) {
      toast.error("Digite a mensagem para agendar");
      return;
    }
    if (!scheduleAt) {
      toast.error("Selecione data e horário");
      return;
    }
    if (!normalizedPhone) {
      toast.error("Telefone do cliente inválido");
      return;
    }

    const date = new Date(scheduleAt);
    if (Number.isNaN(date.getTime())) {
      toast.error("Data/hora inválida");
      return;
    }

    const created = await scheduleMessage({
      contact_phone: normalizedPhone,
      message,
      scheduled_at: date,
    });

    if (created) {
      toast.success("Mensagem agendada!");
      setScheduleOpen(false);
      setScheduleAt("");
      setMessage("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm text-muted-foreground">
          <strong>Enviando para:</strong> {clientPhone}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Mensagem</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem para o cliente..."
          rows={6}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" title="Templates de WhatsApp">
              <FileText className="w-4 h-4" />
              Templates
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Selecionar template (WhatsApp)</DialogTitle>
            </DialogHeader>
            <ClientMessageTemplates
              filterType="whatsapp"
              onSelectTemplate={(t) => {
                const filled = replaceVariables(t.content, {
                  nome: clientName,
                  telefone: clientPhone,
                });
                setMessage(filled);
                setTemplatesOpen(false);
                toast.success("Template aplicado! Agora é só clicar em Enviar.");
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={aiOpen} onOpenChange={setAiOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" title="Gerar mensagem com IA">
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Gerar mensagem com IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Descreva o que você quer enviar</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex.: lembrar da reunião de amanhã às 10h e pedir para confirmar presença."
                  rows={5}
                />
              </div>
              <Button className="w-full gap-2" onClick={generateWithAI} disabled={aiGenerating}>
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar mensagem
              </Button>
              <p className="text-xs text-muted-foreground">
                A IA gera um rascunho curto e acolhedor e pode sugerir um horário; você revisa e aprova.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={sendText}
          disabled={sendingText || !message.trim()}
          className="gap-2"
        >
          {sendingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar
        </Button>

        <Button
          variant="outline"
          onClick={handleFilePick}
          disabled={sendingFile}
          className="gap-2"
          title="Anexar imagem ou PDF"
        >
          {sendingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          Anexar
        </Button>

        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" title="Agendar envio">
              <CalendarClock className="w-4 h-4" />
              Agendar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar mensagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Data e horário</Label>
                <Input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem (será agendada)</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
              </div>
              <Button className="w-full" onClick={scheduleText}>
                Agendar mensagem
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : () => startRecording().catch(() => toast.error("Permita o microfone"))}
            className="gap-2"
            title={isRecording ? "Parar gravação" : "Gravar áudio"}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? "Parar" : "Áudio"}
          </Button>
          <Button
            onClick={sendAudio}
            disabled={!audioBlob || sendingAudio}
            className="gap-2"
            title="Enviar áudio gravado"
          >
            {sendingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar áudio
          </Button>
        </div>
      </div>
    </div>
  );
}
