import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useWhatsAppContacts } from "@/hooks/useWhatsAppContacts";
import { Loader2, Plus, Search, UserPlus, Tag, Trash2, Edit, Bot, BotOff, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ContactsManager() {
  const { contacts, tags, loading, createContact, updateContact, deleteContact, toggleBotDisabled, createTag, deleteTag } = useWhatsAppContacts();
  const [search, setSearch] = useState("");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ phone: "", name: "", notes: "" });
  const [tagForm, setTagForm] = useState({ name: "", color: "#3b82f6" });

  const filteredContacts = contacts.filter(
    (c) =>
      c.phone.includes(search) ||
      c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateContact = async () => {
    if (!contactForm.phone) return;
    const result = await createContact(contactForm);
    if (result) {
      setContactForm({ phone: "", name: "", notes: "" });
      setIsContactDialogOpen(false);
    }
  };

  const handleCreateTag = async () => {
    if (!tagForm.name) return;
    const result = await createTag({ name: tagForm.name, color: tagForm.color });
    if (result) {
      setTagForm({ name: "", color: "#3b82f6" });
      setIsTagDialogOpen(false);
    }
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
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Contato</DialogTitle>
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
                  <Button onClick={handleCreateContact} className="w-full">
                    Adicionar Contato
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
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {contact.name || contact.phone}
                      </div>
                      {contact.name && (
                        <div className="text-sm text-muted-foreground">
                          {contact.phone}
                        </div>
                      )}
                      {contact.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {contact.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {contact.bot_disabled ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <BotOff className="w-3 h-3" />
                          Bot Desativado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          Bot Ativo
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={!contact.bot_disabled}
                      onCheckedChange={(checked) => toggleBotDisabled(contact.id, !checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContact(contact.id)}
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
    </div>
  );
}
