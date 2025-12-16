import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  StickyNote, 
  Tag,
  Clock,
  Zap,
  Sparkles,
  FileText,
  Plus,
  X,
  CalendarIcon,
  Loader2,
  User,
  Edit3,
  UserPlus,
  Users,
  Search
} from "lucide-react";
import { WhatsAppConversation } from "@/hooks/useWhatsAppConversations";
import { useWhatsAppContacts, ContactTag } from "@/hooks/useWhatsAppContacts";
import { useQuickResponses } from "@/hooks/useQuickResponses";
import { useScheduledMessages } from "@/hooks/useScheduledMessages";
import { useConversationAssignees } from "@/hooks/useConversationAssignees";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatDetailsSidebarProps {
  conversation: WhatsAppConversation;
  onContactNameUpdated: () => void;
  onQuickResponseSelect: (content: string) => void;
}

export function ChatDetailsSidebar({ conversation, onContactNameUpdated, onQuickResponseSelect }: ChatDetailsSidebarProps) {
  const { toast } = useToast();
  const { contacts, tags, createContact, createTag, refetch: refetchContacts } = useWhatsAppContacts();
  const { responses } = useQuickResponses();
  const { scheduleMessage } = useScheduledMessages();
  const { assignees, availableUsers, assignUser, removeAssignee, refetch: refetchAssignees } = useConversationAssignees(conversation.id);
  
  const [activeTab, setActiveTab] = useState("info");
  
  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation.contact_name || "");
  const [savingName, setSavingName] = useState(false);
  
  // Notes
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  
  // Schedule
  const [scheduleMessage_, setScheduleMessage_] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);
  
  // Tags
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [creatingTag, setCreatingTag] = useState(false);
  
  // Summary/Transcription
  const [summary, setSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [generatingTranscription, setGeneratingTranscription] = useState(false);
  
  // Assignee
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  
  // ManyChat subscriber ID
  const [editingSubscriberId, setEditingSubscriberId] = useState(false);
  const [subscriberId, setSubscriberId] = useState(conversation.manychat_subscriber_id || "");
  const [savingSubscriberId, setSavingSubscriberId] = useState(false);
  const [searchingSubscriber, setSearchingSubscriber] = useState(false);

  const existingContact = contacts.find(c => c.phone === conversation.contact_phone);

  const formatPhone = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ contact_name: newName.trim() })
        .eq("id", conversation.id);
      
      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Nome atualizado" });
      setEditingName(false);
      onContactNameUpdated();
    } catch (error) {
      console.error("Error updating name:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar", variant: "destructive" });
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
      toast({ title: "Sucesso", description: "Contato cadastrado" });
      refetchContacts();
    } catch (error) {
      console.error("Error creating contact:", error);
      toast({ title: "Erro", description: "Não foi possível cadastrar", variant: "destructive" });
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
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
      toast({ title: "Sucesso", description: "Anotação salva" });
      setNoteText("");
      refetchContacts();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ title: "Erro", description: "Não foi possível salvar", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!scheduleMessage_.trim() || !scheduleDate) return;
    setScheduling(true);
    try {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      await scheduleMessage({
        contact_phone: conversation.contact_phone,
        message: scheduleMessage_,
        scheduled_at: scheduledAt,
      });
      
      toast({ title: "Sucesso", description: `Agendado para ${format(scheduledAt, "dd/MM 'às' HH:mm", { locale: ptBR })}` });
      setScheduleMessage_("");
      setScheduleDate(undefined);
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast({ title: "Erro", description: "Não foi possível agendar", variant: "destructive" });
    } finally {
      setScheduling(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    try {
      await createTag({ name: newTagName.trim(), color: newTagColor });
      toast({ title: "Sucesso", description: "Tag criada" });
      setNewTagName("");
      refetchContacts();
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({ title: "Erro", description: "Não foi possível criar", variant: "destructive" });
    } finally {
      setCreatingTag(false);
    }
  };

  const handleToggleTag = async (tag: ContactTag) => {
    if (!existingContact) {
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
        const { error } = await supabase
          .from("whatsapp_contact_tags")
          .delete()
          .eq("contact_id", existingContact.id)
          .eq("tag_id", tag.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_contact_tags")
          .insert({ contact_id: existingContact.id, tag_id: tag.id });
        if (error) throw error;
      }
      
      toast({ title: "Sucesso", description: isTagged ? "Tag removida" : "Tag adicionada" });
      refetchContacts();
    } catch (error) {
      console.error("Error toggling tag:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar", variant: "destructive" });
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
      setSummary("Erro ao gerar resumo.");
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
      setTranscription("Erro ao gerar transcrição.");
    } finally {
      setGeneratingTranscription(false);
    }
  };

  const TAG_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", 
    "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6"
  ];

  return (
    <div className="h-full flex flex-col border-l bg-card">
      {/* Header with contact info */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase">Nome:</span>
          {!editingName && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingName(true)}>
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
        {editingName ? (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome"
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleSaveName} disabled={savingName}>
              {savingName ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <p className="font-medium">{conversation.contact_name || "Sem nome"}</p>
        )}
        <p className="text-sm text-muted-foreground">{formatPhone(conversation.contact_phone)}</p>
        
        {!existingContact && (
          <Button variant="outline" size="sm" className="w-full" onClick={handleAddContact}>
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar contato
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap h-auto">
          <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <User className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="assignees" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <Users className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <StickyNote className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="tags" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <Tag className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <Clock className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="quick" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <Zap className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 py-2">
            <Sparkles className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Info Tab */}
          <TabsContent value="info" className="m-0 p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Canal</p>
              <Badge variant="outline">{conversation.channel?.toUpperCase() || 'WHATSAPP'}</Badge>
            </div>
            
            {/* ManyChat Subscriber ID for Instagram/Facebook */}
            {(conversation.channel === 'instagram' || conversation.channel === 'facebook') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground uppercase">ManyChat Subscriber ID</p>
                  {!editingSubscriberId && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingSubscriberId(true)}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {editingSubscriberId ? (
                  <div className="flex gap-2">
                    <Input
                      value={subscriberId}
                      onChange={(e) => setSubscriberId(e.target.value)}
                      placeholder="ID do subscriber"
                      className="h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        setSavingSubscriberId(true);
                        try {
                          const { error } = await supabase
                            .from("whatsapp_conversations")
                            .update({ manychat_subscriber_id: subscriberId.trim() || null })
                            .eq("id", conversation.id);
                          if (error) throw error;
                          toast({ title: "Sucesso", description: "Subscriber ID salvo" });
                          setEditingSubscriberId(false);
                          onContactNameUpdated();
                        } catch (error) {
                          console.error("Error saving subscriber ID:", error);
                          toast({ title: "Erro", description: "Não foi possível salvar", variant: "destructive" });
                        } finally {
                          setSavingSubscriberId(false);
                        }
                      }} 
                      disabled={savingSubscriberId}
                    >
                      {savingSubscriberId ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSubscriberId(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-mono">
                    {conversation.manychat_subscriber_id || (
                      <span className="text-muted-foreground italic">Não vinculado</span>
                    )}
                  </p>
                )}
                {!conversation.manychat_subscriber_id && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-amber-500">
                      Vincule o subscriber ID do ManyChat para enviar mensagens
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={async () => {
                        setSearchingSubscriber(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("manychat-find-subscriber", {
                            body: { conversationId: conversation.id },
                          });
                          
                          if (error) throw error;
                          
                          if (data?.error) {
                            toast({ 
                              title: data.limitation ? "Limitação da API" : "Não encontrado", 
                              description: data.message || "Subscriber não encontrado no ManyChat",
                              variant: data.limitation ? "default" : "destructive",
                              duration: data.limitation ? 8000 : 5000,
                            });
                          } else if (data?.subscriberId) {
                            setSubscriberId(data.subscriberId);
                            toast({ 
                              title: "Sucesso", 
                              description: `Subscriber encontrado: ${data.subscriberData?.name || data.subscriberId}` 
                            });
                            onContactNameUpdated();
                          }
                        } catch (error) {
                          console.error("Error searching subscriber:", error);
                          toast({ 
                            title: "Erro", 
                            description: "Não foi possível buscar o subscriber",
                            variant: "destructive" 
                          });
                        } finally {
                          setSearchingSubscriber(false);
                        }
                      }}
                      disabled={searchingSubscriber}
                    >
                      {searchingSubscriber ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Buscar automaticamente
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {assignees.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Responsáveis</p>
                <div className="flex flex-wrap gap-1">
                  {assignees.map((a) => (
                    <Badge key={a.id} variant="secondary" className="text-xs">
                      {a.user_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {existingContact?.notes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Anotações</p>
                <div className="p-2 bg-muted rounded text-sm whitespace-pre-wrap">
                  {existingContact.notes}
                </div>
              </div>
            )}
            {existingContact?.tags && existingContact.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {existingContact.tags.map((tag) => (
                    <Badge key={tag.id} style={{ backgroundColor: tag.color || "#3b82f6" }} className="text-white text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Assignees Tab */}
          <TabsContent value="assignees" className="m-0 p-4 space-y-4">
            <p className="text-sm font-medium">Responsáveis</p>
            
            {assignees.length > 0 && (
              <div className="space-y-2">
                {assignees.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{a.user_name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAssignee(a.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Adicionar responsável:</p>
              <div className="flex gap-2">
                <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue placeholder="Selecionar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(u => !assignees.some(a => a.user_id === u.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => {
                    if (selectedAssigneeId) {
                      assignUser(selectedAssigneeId);
                      setSelectedAssigneeId("");
                    }
                  }}
                  disabled={!selectedAssigneeId}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="m-0 p-4 space-y-3">
            <p className="text-sm font-medium">Anotações</p>
            {existingContact?.notes && (
              <div className="p-2 bg-muted rounded text-sm whitespace-pre-wrap max-h-32 overflow-auto">
                {existingContact.notes}
              </div>
            )}
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Nova anotação..."
              rows={3}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()} className="w-full">
              {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar anotação"}
            </Button>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="m-0 p-4 space-y-4">
            <p className="text-sm font-medium">Tags</p>
            
            {existingContact?.tags && existingContact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {existingContact.tags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    style={{ backgroundColor: tag.color || "#3b82f6" }}
                    className="text-white cursor-pointer text-xs"
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Adicionar tag:</p>
              <div className="flex flex-wrap gap-1">
                {tags.filter(t => !existingContact?.tags?.some(ct => ct.id === t.id)).map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline"
                    style={{ borderColor: tag.color || "#3b82f6", color: tag.color || "#3b82f6" }}
                    className="cursor-pointer hover:opacity-80 text-xs"
                    onClick={() => handleToggleTag(tag)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Nova tag:</p>
              <div className="flex gap-1">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nome"
                  className="flex-1 h-8 text-sm"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" style={{ backgroundColor: newTagColor }} />
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
                <Button size="icon" className="h-8 w-8" onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()}>
                  {creatingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="m-0 p-4 space-y-3">
            <p className="text-sm font-medium">Agendar mensagem</p>
            <Textarea
              value={scheduleMessage_}
              onChange={(e) => setScheduleMessage_(e.target.value)}
              placeholder="Mensagem..."
              rows={2}
              className="text-sm"
            />
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {scheduleDate ? format(scheduleDate, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
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
                className="h-8"
              />
            </div>
            <Button size="sm" onClick={handleScheduleMessage} disabled={scheduling || !scheduleMessage_.trim() || !scheduleDate} className="w-full">
              {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agendar"}
            </Button>
          </TabsContent>

          {/* Quick Responses Tab */}
          <TabsContent value="quick" className="m-0 p-4 space-y-3">
            <p className="text-sm font-medium">Respostas rápidas</p>
            {responses.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma resposta cadastrada</p>
            ) : (
              <div className="space-y-2">
                {responses.map((response) => (
                  <Button
                    key={response.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 text-xs"
                    onClick={() => onQuickResponseSelect(response.content)}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">{response.title}</span>
                      <span className="text-muted-foreground">/{response.shortcut}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="m-0 p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Resumo IA</p>
              {!summary ? (
                <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={generatingSummary} className="w-full">
                  {generatingSummary ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar resumo
                </Button>
              ) : (
                <div className="p-2 bg-muted rounded text-xs whitespace-pre-wrap max-h-32 overflow-auto">
                  {summary}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Transcrição</p>
              {!transcription ? (
                <Button size="sm" variant="outline" onClick={handleGenerateTranscription} disabled={generatingTranscription} className="w-full">
                  {generatingTranscription ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Transcrever
                </Button>
              ) : (
                <div className="p-2 bg-muted rounded text-xs whitespace-pre-wrap font-mono max-h-48 overflow-auto">
                  {transcription}
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
