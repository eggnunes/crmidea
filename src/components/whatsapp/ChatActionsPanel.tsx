import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MoreVertical, 
  UserPlus, 
  Edit3, 
  Clock, 
  StickyNote, 
  Zap, 
  FileText, 
  Sparkles,
  Tag,
  Plus,
  X,
  CalendarIcon,
  Loader2
} from "lucide-react";
import { WhatsAppConversation } from "@/hooks/useWhatsAppConversations";
import { useWhatsAppContacts, ContactTag } from "@/hooks/useWhatsAppContacts";
import { useQuickResponses } from "@/hooks/useQuickResponses";
import { useScheduledMessages } from "@/hooks/useScheduledMessages";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatActionsPanelProps {
  conversation: WhatsAppConversation;
  onContactNameUpdated: () => void;
  onQuickResponseSelect: (content: string) => void;
}

export function ChatActionsPanel({ conversation, onContactNameUpdated, onQuickResponseSelect }: ChatActionsPanelProps) {
  const { toast } = useToast();
  const { contacts, tags, createContact, createTag, refetch: refetchContacts } = useWhatsAppContacts();
  const { responses } = useQuickResponses();
  const { scheduleMessage } = useScheduledMessages();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState(conversation.contact_name || "");
  const [savingName, setSavingName] = useState(false);
  
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMessage_, setScheduleMessage_] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);
  
  const [quickResponsesOpen, setQuickResponsesOpen] = useState(false);
  
  const [tagsOpen, setTagsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [creatingTag, setCreatingTag] = useState(false);
  const [contactTags, setContactTags] = useState<string[]>([]);
  
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [generatingTranscription, setGeneratingTranscription] = useState(false);

  // Find existing contact
  const existingContact = contacts.find(c => c.phone === conversation.contact_phone);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ contact_name: newName.trim() })
        .eq("id", conversation.id);
      
      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Nome atualizado com sucesso" });
      setEditNameOpen(false);
      onContactNameUpdated();
    } catch (error) {
      console.error("Error updating name:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o nome", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleAddContact = async () => {
    try {
      await createContact({
        phone: conversation.contact_phone,
        name: conversation.contact_name || undefined,
      });
      toast({ title: "Sucesso", description: "Contato cadastrado com sucesso" });
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating contact:", error);
      toast({ title: "Erro", description: "Não foi possível cadastrar o contato", variant: "destructive" });
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      // If contact exists, update notes. Otherwise create contact with notes
      if (existingContact) {
        const { error } = await supabase
          .from("whatsapp_contacts")
          .update({ notes: existingContact.notes ? `${existingContact.notes}\n\n${noteText}` : noteText })
          .eq("id", existingContact.id);
        if (error) throw error;
      } else {
        await createContact({
          phone: conversation.contact_phone,
          name: conversation.contact_name || undefined,
          notes: noteText,
        });
      }
      toast({ title: "Sucesso", description: "Anotação salva com sucesso" });
      setNoteText("");
      setNoteOpen(false);
      refetchContacts();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ title: "Erro", description: "Não foi possível salvar a anotação", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!scheduleMessage_.trim() || !scheduleDate) return;
    setScheduling(true);
    try {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      const scheduledAt = new Date(scheduleDate!);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      await scheduleMessage({
        contact_phone: conversation.contact_phone,
        message: scheduleMessage_,
        scheduled_at: scheduledAt,
      });
      
      toast({ title: "Sucesso", description: `Mensagem agendada para ${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` });
      setScheduleMessage_("");
      setScheduleDate(undefined);
      setScheduleOpen(false);
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast({ title: "Erro", description: "Não foi possível agendar a mensagem", variant: "destructive" });
    } finally {
      setScheduling(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    try {
      await createTag({ name: newTagName.trim(), color: newTagColor });
      toast({ title: "Sucesso", description: "Tag criada com sucesso" });
      setNewTagName("");
      refetchContacts();
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({ title: "Erro", description: "Não foi possível criar a tag", variant: "destructive" });
    } finally {
      setCreatingTag(false);
    }
  };

  const handleToggleTag = async (tag: ContactTag) => {
    if (!existingContact) {
      // Create contact first
      await createContact({
        phone: conversation.contact_phone,
        name: conversation.contact_name || undefined,
      });
      refetchContacts();
      return;
    }

    try {
      const isTagged = existingContact.tags?.some(t => t.id === tag.id);
      
      if (isTagged) {
        // Remove tag
        const { error } = await supabase
          .from("whatsapp_contact_tags")
          .delete()
          .eq("contact_id", existingContact.id)
          .eq("tag_id", tag.id);
        if (error) throw error;
      } else {
        // Add tag
        const { error } = await supabase
          .from("whatsapp_contact_tags")
          .insert({ contact_id: existingContact.id, tag_id: tag.id });
        if (error) throw error;
      }
      
      toast({ title: "Sucesso", description: isTagged ? "Tag removida" : "Tag adicionada" });
      refetchContacts();
    } catch (error) {
      console.error("Error toggling tag:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a tag", variant: "destructive" });
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-chat-summary", {
        body: { conversationId: conversation.id },
      });
      
      if (error) throw error;
      setSummary(data.summary || "Não foi possível gerar o resumo.");
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("Erro ao gerar resumo. Tente novamente.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateTranscription = async () => {
    setGeneratingTranscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-chat-transcription", {
        body: { conversationId: conversation.id },
      });
      
      if (error) throw error;
      setTranscription(data.transcription || "Não foi possível gerar a transcrição.");
    } catch (error) {
      console.error("Error generating transcription:", error);
      setTranscription("Erro ao gerar transcrição. Tente novamente.");
    } finally {
      setGeneratingTranscription(false);
    }
  };

  const TAG_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", 
    "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6"
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          {/* Edit Name */}
          <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <Edit3 className="w-4 h-4" />
                Alterar nome
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar nome do chat</DialogTitle>
              </DialogHeader>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do contato"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditNameOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveName} disabled={savingName}>
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add as Contact */}
          {!existingContact && (
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm" onClick={handleAddContact}>
              <UserPlus className="w-4 h-4" />
              Cadastrar contato
            </Button>
          )}

          {/* Notes */}
          <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <StickyNote className="w-4 h-4" />
                Anotações
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anotações do chat</DialogTitle>
              </DialogHeader>
              {existingContact?.notes && (
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap mb-2">
                  {existingContact.notes}
                </div>
              )}
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar nova anotação..."
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                  {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Schedule Message */}
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <Clock className="w-4 h-4" />
                Agendar mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agendar mensagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={scheduleMessage_}
                  onChange={(e) => setScheduleMessage_(e.target.value)}
                  placeholder="Digite a mensagem..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {scheduleDate ? format(scheduleDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancelar</Button>
                <Button onClick={handleScheduleMessage} disabled={scheduling || !scheduleMessage_.trim() || !scheduleDate}>
                  {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agendar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Quick Responses */}
          <Dialog open={quickResponsesOpen} onOpenChange={setQuickResponsesOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <Zap className="w-4 h-4" />
                Respostas rápidas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Respostas rápidas</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-80">
                {responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma resposta rápida cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {responses.map((response) => (
                      <Button
                        key={response.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => {
                          onQuickResponseSelect(response.content);
                          setQuickResponsesOpen(false);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium">{response.title}</span>
                          <span className="text-xs text-muted-foreground">/{response.shortcut}</span>
                          <span className="text-sm text-muted-foreground line-clamp-2">{response.content}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Tags */}
          <Dialog open={tagsOpen} onOpenChange={setTagsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <Tag className="w-4 h-4" />
                Tags
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar tags</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Current tags */}
                {existingContact?.tags && existingContact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingContact.tags.map((tag) => (
                      <Badge 
                        key={tag.id} 
                        style={{ backgroundColor: tag.color || "#3b82f6" }}
                        className="text-white cursor-pointer"
                        onClick={() => handleToggleTag(tag)}
                      >
                        {tag.name}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Available tags */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tags disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(t => !existingContact?.tags?.some(ct => ct.id === t.id)).map((tag) => (
                      <Badge 
                        key={tag.id} 
                        variant="outline"
                        style={{ borderColor: tag.color || "#3b82f6", color: tag.color || "#3b82f6" }}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => handleToggleTag(tag)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Create new tag */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Criar nova tag:</p>
                  <div className="flex gap-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nome da tag"
                      className="flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" style={{ backgroundColor: newTagColor }}>
                          <div className="w-4 h-4 rounded" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-5 gap-1">
                          {TAG_COLORS.map((color) => (
                            <button
                              key={color}
                              className={cn(
                                "w-6 h-6 rounded border-2",
                                newTagColor === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewTagColor(color)}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()}>
                      {creatingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Generate Summary */}
          <Dialog open={summaryOpen} onOpenChange={(open) => { setSummaryOpen(open); if (!open) setSummary(""); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <Sparkles className="w-4 h-4" />
                Gerar resumo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resumo da conversa</DialogTitle>
              </DialogHeader>
              {!summary ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <p className="text-sm text-muted-foreground text-center">
                    Gere um resumo automático de toda a conversa usando IA
                  </p>
                  <Button onClick={handleGenerateSummary} disabled={generatingSummary}>
                    {generatingSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar resumo
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                  {summary}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Transcription */}
          <Dialog open={transcriptionOpen} onOpenChange={(open) => { setTranscriptionOpen(open); if (!open) setTranscription(""); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <FileText className="w-4 h-4" />
                Transcrever conversa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Transcrição da conversa</DialogTitle>
              </DialogHeader>
              {!transcription ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <p className="text-sm text-muted-foreground text-center">
                    Gere uma transcrição completa e formatada da conversa
                  </p>
                  <Button onClick={handleGenerateTranscription} disabled={generatingTranscription}>
                    {generatingTranscription ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar transcrição
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm font-mono">
                    {transcription}
                  </div>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}
