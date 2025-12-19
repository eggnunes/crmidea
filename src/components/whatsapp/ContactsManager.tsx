import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWhatsAppContacts } from "@/hooks/useWhatsAppContacts";
import { useLeads } from "@/hooks/useLeads";
import { PRODUCTS } from "@/types/crm";
import { Loader2, Plus, Search, UserPlus, Tag, Trash2, Edit, Bot, BotOff, Phone, UserCheck, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StartConversationButton } from "./StartConversationButton";

interface ContactsManagerProps {
  onStartConversation?: (conversationId: string) => void;
}

export function ContactsManager({ onStartConversation }: ContactsManagerProps) {
  const { contacts, tags, loading, createContact, updateContact, deleteContact, toggleBotDisabled, createTag, deleteTag } = useWhatsAppContacts();
  const { addLead } = useLeads();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ phone: "", name: "", notes: "" });
  const [tagForm, setTagForm] = useState({ name: "", color: "#3b82f6" });
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    product: "consultoria" as string,
    source: "whatsapp",
    notes: "",
    value: 0,
  });

  const filteredContacts = contacts.filter(
    (c) =>
      c.phone.includes(search) ||
      c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrUpdateContact = async () => {
    if (!contactForm.phone) return;
    
    if (editingContactId) {
      await updateContact(editingContactId, {
        phone: contactForm.phone,
        name: contactForm.name || null,
        notes: contactForm.notes || null,
      });
    } else {
      await createContact(contactForm);
    }
    
    setContactForm({ phone: "", name: "", notes: "" });
    setEditingContactId(null);
    setIsContactDialogOpen(false);
  };

  const handleEditContact = (contact: typeof contacts[0]) => {
    setContactForm({
      phone: contact.phone,
      name: contact.name || "",
      notes: contact.notes || "",
    });
    setEditingContactId(contact.id);
    setIsContactDialogOpen(true);
  };

  const handleOpenLeadDialog = (contact: typeof contacts[0]) => {
    setLeadForm({
      name: contact.name || "",
      email: "",
      phone: contact.phone,
      product: "consultoria",
      source: "whatsapp",
      notes: contact.notes || "",
      value: 0,
    });
    setIsLeadDialogOpen(true);
  };

  const handleCreateLead = async () => {
    if (!leadForm.name || !leadForm.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    await addLead({
      name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone,
      product: leadForm.product as any,
      status: 'novo',
      source: leadForm.source,
      notes: leadForm.notes,
      value: leadForm.value,
    });
    
    toast({
      title: "Sucesso",
      description: "Lead criado com sucesso!",
    });
    
    setLeadForm({
      name: "",
      email: "",
      phone: "",
      product: "consultoria",
      source: "whatsapp",
      notes: "",
      value: 0,
    });
    setIsLeadDialogOpen(false);
  };

  const handleCreateTag = async () => {
    if (!tagForm.name) return;
    const result = await createTag({ name: tagForm.name, color: tagForm.color });
    if (result) {
      setTagForm({ name: "", color: "#3b82f6" });
      setIsTagDialogOpen(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
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
    <div className="space-y-6">
      {/* Tags Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </CardTitle>
              <CardDescription>Crie tags para organizar seus contatos</CardDescription>
            </div>
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nome da Tag</Label>
                    <Input
                      value={tagForm.name}
                      onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                      placeholder="Ex: Cliente VIP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateTag} className="w-full">
                    Criar Tag
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tag criada ainda
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-2 py-1.5 px-3"
                  style={{ backgroundColor: tag.color + "20", borderColor: tag.color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contatos ({contacts.length})
              </CardTitle>
              <CardDescription>Gerencie seus contatos e controle o bot</CardDescription>
            </div>
            <Dialog open={isContactDialogOpen} onOpenChange={(open) => {
              setIsContactDialogOpen(open);
              if (!open) {
                setEditingContactId(null);
                setContactForm({ phone: "", name: "", notes: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingContactId ? "Editar Contato" : "Adicionar Contato"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                      placeholder="Notas sobre o contato..."
                    />
                  </div>
                  <Button onClick={handleCreateOrUpdateContact} className="w-full">
                    {editingContactId ? "Salvar Alterações" : "Adicionar Contato"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por telefone ou nome..."
              className="pl-10"
            />
          </div>

          {filteredContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {contacts.length === 0
                ? "Nenhum contato cadastrado"
                : "Nenhum contato encontrado"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {contact.name || formatPhone(contact.phone)}
                      </div>
                      {contact.name && (
                        <div className="text-sm text-muted-foreground">
                          {formatPhone(contact.phone)}
                        </div>
                      )}
                      {contact.notes && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {contact.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {contact.bot_disabled ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <BotOff className="w-3 h-3" />
                          <span className="hidden sm:inline">Bot Desativado</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          <span className="hidden sm:inline">Bot Ativo</span>
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={!contact.bot_disabled}
                      onCheckedChange={(checked) => toggleBotDisabled(contact.id, !checked)}
                    />
                    <StartConversationButton 
                      phone={contact.phone} 
                      name={contact.name || undefined}
                      onConversationStarted={onStartConversation}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditContact(contact)}
                      title="Editar contato"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenLeadDialog(contact)}
                      title="Converter em lead"
                    >
                      <UserCheck className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContact(contact.id)}
                      title="Excluir contato"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convert to Lead Dialog */}
      <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Converter Contato em Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Nome do lead"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="5511999999999"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={leadForm.value}
                  onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={leadForm.product} onValueChange={(v) => setLeadForm({ ...leadForm, product: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTS.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Input
                  value={leadForm.source}
                  onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                  placeholder="WhatsApp"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                placeholder="Notas sobre o lead..."
                rows={3}
              />
            </div>
            <Button onClick={handleCreateLead} className="w-full">
              <UserCheck className="w-4 h-4 mr-2" />
              Criar Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}