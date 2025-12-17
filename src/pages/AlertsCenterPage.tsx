import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageCircle,
  Send,
  Phone,
  Mail,
  Package,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const productLabels: Record<string, string> = {
  consultoria: "Consultoria",
  mentoria_coletiva: "Mentoria Coletiva",
  mentoria_individual: "Mentoria Individual",
  curso_idea: "Curso IDEA",
  guia_ia: "Guia IA",
  codigo_prompts: "Código Prompts",
  combo_ebooks: "Combo E-books",
};

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificado: "Qualificado",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  fechado_ganho: "Fechado (Ganho)",
  fechado_perdido: "Fechado (Perdido)",
};

interface LeadCardProps {
  lead: any;
  type: "purchase" | "abandoned" | "refund" | "problem";
  onSendMessage: (lead: any, message: string) => void;
}

function LeadCard({ lead, type, onSendMessage }: LeadCardProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!message.trim() || !lead.phone) return;
    setSending(true);
    await onSendMessage(lead, message);
    setMessage("");
    setSending(false);
    setShowInput(false);
  };

  const goToConversation = () => {
    const phone = lead.phone?.replace(/\D/g, '') || '';
    navigate(`/whatsapp?phone=${phone}`);
  };

  const getEventInfo = () => {
    const notes = lead.notes || "";
    const kiwifyMatch = notes.match(/\[Kiwify ([^\]]+)\] ([^:]+)/);
    if (kiwifyMatch) {
      return {
        date: new Date(kiwifyMatch[1]),
        event: kiwifyMatch[2]
      };
    }
    return null;
  };

  const eventInfo = getEventInfo();

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{lead.name}</span>
              <Badge variant={type === "purchase" ? "default" : type === "abandoned" ? "secondary" : "destructive"}>
                {type === "purchase" ? "Compra" : type === "abandoned" ? "Abandono" : type === "refund" ? "Reembolso" : "Problema"}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3" />
                {productLabels[lead.product] || lead.product}
              </div>
              {eventInfo && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {format(eventInfo.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {lead.phone && (
              <Button size="sm" variant="outline" onClick={goToConversation}>
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </Button>
            )}
            {lead.phone && !showInput && (
              <Button size="sm" variant="secondary" onClick={() => setShowInput(true)}>
                <Send className="h-4 w-4 mr-1" />
                Enviar
              </Button>
            )}
          </div>
        </div>

        {showInput && lead.phone && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSend} disabled={sending || !message.trim()}>
                {sending ? "Enviando..." : "Enviar WhatsApp"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AlertsCenterPage() {
  const { leads } = useLeads();
  const { toast } = useToast();

  // Filter leads by category based on notes/status
  const purchaseLeads = leads.filter(l => 
    l.status === "fechado-ganho" || 
    l.notes?.toLowerCase().includes("compra_aprovada")
  ).slice(0, 50);

  const abandonedLeads = leads.filter(l =>
    l.notes?.toLowerCase().includes("carrinho_abandonado") ||
    l.notes?.toLowerCase().includes("pix_gerado") ||
    l.notes?.toLowerCase().includes("boleto_gerado")
  ).slice(0, 50);

  const refundLeads = leads.filter(l =>
    l.notes?.toLowerCase().includes("reembolso") ||
    l.notes?.toLowerCase().includes("compra_reembolsada") ||
    l.status === "fechado-perdido"
  ).slice(0, 50);

  const problemLeads = leads.filter(l =>
    l.notes?.toLowerCase().includes("chargeback") ||
    l.notes?.toLowerCase().includes("compra_recusada") ||
    l.notes?.toLowerCase().includes("assinatura_cancelada") ||
    l.notes?.toLowerCase().includes("assinatura_atrasada")
  ).slice(0, 50);

  const sendWhatsAppMessage = async (lead: any, message: string) => {
    if (!lead.phone) {
      toast({
        title: "Erro",
        description: "Lead não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          phone: lead.phone,
          message: message,
        },
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${lead.name}.`,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Central de Alertas</h1>
        <p className="text-muted-foreground">
          Gerencie compras, abandonos e recupere leads
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{purchaseLeads.length}</p>
              <p className="text-sm text-muted-foreground">Compras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <ShoppingCart className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{abandonedLeads.length}</p>
              <p className="text-sm text-muted-foreground">Abandonos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/10">
              <XCircle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{refundLeads.length}</p>
              <p className="text-sm text-muted-foreground">Reembolsos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{problemLeads.length}</p>
              <p className="text-sm text-muted-foreground">Problemas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="purchases" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Compras ({purchaseLeads.length})
          </TabsTrigger>
          <TabsTrigger value="abandoned" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Abandonos ({abandonedLeads.length})
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-2">
            <XCircle className="h-4 w-4" />
            Reembolsos ({refundLeads.length})
          </TabsTrigger>
          <TabsTrigger value="problems" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Problemas ({problemLeads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Compras Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {purchaseLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma compra registrada ainda
                  </p>
                ) : (
                  purchaseLeads.map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      type="purchase" 
                      onSendMessage={sendWhatsAppMessage}
                    />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abandoned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-yellow-500" />
                Carrinhos Abandonados / PIX/Boleto Gerado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {abandonedLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum abandono registrado
                  </p>
                ) : (
                  abandonedLeads.map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      type="abandoned" 
                      onSendMessage={sendWhatsAppMessage}
                    />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-500" />
                Reembolsos Solicitados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {refundLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum reembolso registrado
                  </p>
                ) : (
                  refundLeads.map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      type="refund" 
                      onSendMessage={sendWhatsAppMessage}
                    />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Chargebacks, Recusas e Cancelamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {problemLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum problema registrado
                  </p>
                ) : (
                  problemLeads.map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      type="problem" 
                      onSendMessage={sendWhatsAppMessage}
                    />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AlertsCenterPage;
