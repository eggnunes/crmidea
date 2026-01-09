import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, MessageSquare, Send, Loader2, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientMessageTemplates } from "./ClientMessageTemplates";

interface ClientCommunicationProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  template_type: "whatsapp" | "email";
  category: string;
  subject?: string;
}

export function ClientCommunication({ clientId, clientName, clientEmail, clientPhone }: ClientCommunicationProps) {
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState("whatsapp");

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{nome\}\}/g, clientName)
      .replace(/\{\{email\}\}/g, clientEmail)
      .replace(/\{\{telefone\}\}/g, clientPhone)
      .replace(/\{\{escritorio\}\}/g, clientName); // Fallback se não houver nome do escritório
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    const processedContent = replaceVariables(template.content);
    
    if (template.template_type === "whatsapp") {
      setWhatsappMessage(processedContent);
      setActiveTab("whatsapp");
    } else {
      setEmailContent(processedContent);
      if (template.subject) {
        setEmailSubject(replaceVariables(template.subject));
      }
      setActiveTab("email");
    }
    setShowTemplates(false);
    toast.success("Template aplicado!");
  };

  const sendWhatsApp = async () => {
    if (!whatsappMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setSendingWhatsapp(true);
    try {
      const { data, error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          phone: clientPhone,
          content: whatsappMessage
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success("Mensagem enviada via WhatsApp!");
        setWhatsappSent(true);
        setWhatsappMessage("");
        setTimeout(() => setWhatsappSent(false), 3000);
      } else {
        throw new Error(data?.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Erro ao enviar mensagem. Verifique se o WhatsApp está conectado.");
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error("Preencha o assunto e o conteúdo do e-mail");
      return;
    }

    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-client-email", {
        body: {
          clientEmail,
          clientName,
          subject: emailSubject,
          content: emailContent
        }
      });

      if (error) throw error;
      
      toast.success("E-mail enviado com sucesso!");
      setEmailSent(true);
      setEmailSubject("");
      setEmailContent("");
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Comunicação com o Cliente
            </CardTitle>
            <CardDescription>
              Envie mensagens via WhatsApp ou E-mail para {clientName}
            </CardDescription>
          </div>
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Selecionar Template</DialogTitle>
              </DialogHeader>
              <ClientMessageTemplates 
                onSelectTemplate={handleSelectTemplate}
                filterType="all"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Enviando para:</strong> {clientPhone}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Digite sua mensagem para o cliente..."
                rows={6}
              />
            </div>

            <Button
              onClick={sendWhatsApp}
              disabled={sendingWhatsapp || !whatsappMessage.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {sendingWhatsapp ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : whatsappSent ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              {whatsappSent ? "Enviado!" : "Enviar via WhatsApp"}
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Enviando para:</strong> {clientEmail}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto do e-mail"
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Conteúdo do e-mail..."
                rows={8}
              />
            </div>

            <Button
              onClick={sendEmail}
              disabled={sendingEmail || !emailSubject.trim() || !emailContent.trim()}
              className="w-full"
            >
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : emailSent ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {emailSent ? "Enviado!" : "Enviar E-mail"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
