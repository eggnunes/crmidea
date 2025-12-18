import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, Search, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

interface NewConversationDialogProps {
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationDialog({ onConversationCreated }: NewConversationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchContact, setSearchContact] = useState("");
  const [searchLead, setSearchLead] = useState("");
  const [loading, setLoading] = useState(false);
  
  // New conversation form
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchContacts();
      fetchLeads();
    }
  }, [open, user]);

  const fetchContacts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("whatsapp_contacts")
      .select("id, phone, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true });
    setContacts(data || []);
  };

  const fetchLeads = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leads")
      .select("id, name, phone, email")
      .eq("user_id", user.id)
      .not("phone", "is", null)
      .order("name", { ascending: true });
    setLeads(data || []);
  };

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.phone.includes(searchContact)
  );

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchLead.toLowerCase()) ||
    l.phone?.includes(searchLead) ||
    l.email.toLowerCase().includes(searchLead.toLowerCase())
  );

  const startConversation = async (phone: string, name: string | null, leadId?: string) => {
    if (!user || !message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Format phone number
      const formattedPhone = phone.replace(/\D/g, "");
      
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("contact_phone", formattedPhone)
        .eq("channel", "whatsapp")
        .single();

      let conversationId: string;

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("whatsapp_conversations")
          .insert({
            user_id: user.id,
            contact_phone: formattedPhone,
            contact_name: name,
            channel: "whatsapp",
            lead_id: leadId || null,
          })
          .select("id")
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // Send message via Z-API
      const { error: sendError } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          conversationId,
          content: message,
        },
      });

      if (sendError) throw sendError;

      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!",
      });

      setMessage("");
      setNewPhone("");
      setNewName("");
      setOpen(false);
      onConversationCreated(conversationId);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = () => {
    if (!newPhone.trim()) {
      toast({
        title: "Erro",
        description: "Digite o número de telefone",
        variant: "destructive",
      });
      return;
    }
    startConversation(newPhone, newName || null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Iniciar Nova Conversa</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">Novo Número</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem que deseja enviar..."
              className="mt-1"
              rows={3}
            />
          </div>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="5511999999999"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nome (opcional)</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do contato"
                  className="mt-1"
                />
              </div>
            </div>
            <Button 
              onClick={handleNewConversation} 
              disabled={sending || !message.trim()}
              className="w-full"
            >
              {sending ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                placeholder="Buscar contato..."
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[250px]">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum contato encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => startConversation(contact.phone, contact.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        </div>
                      </div>
                      <Button size="sm" disabled={sending || !message.trim()}>
                        {sending ? "..." : "Enviar"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchLead}
                onChange={(e) => setSearchLead(e.target.value)}
                placeholder="Buscar lead..."
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[250px]">
              {filteredLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum lead com telefone encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => lead.phone && startConversation(lead.phone, lead.name, lead.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.phone}</p>
                        </div>
                      </div>
                      <Button size="sm" disabled={sending || !message.trim() || !lead.phone}>
                        {sending ? "..." : "Enviar"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
