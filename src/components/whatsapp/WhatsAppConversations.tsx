import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Search, Send, MessageSquare, User, Bot, Mic, Square, Play, Trash2, MessageCircle, Instagram, Facebook, PanelRightClose, PanelRightOpen, Paperclip, SearchIcon, Users, ChevronDown, ChevronUp, Circle, Star, StarOff, Tag, Plus, X, FileText, Image, File, ArrowLeft } from "lucide-react";
import { useWhatsAppConversations, ChannelType } from "@/hooks/useWhatsAppConversations";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useGlobalMessageSearch } from "@/hooks/useGlobalMessageSearch";
import { useAllConversationAssignees, useConversationAssignees } from "@/hooks/useConversationAssignees";
import { useWhatsAppContacts } from "@/hooks/useWhatsAppContacts";
import { useMessageTemplates, MessageTemplate } from "@/hooks/useMessageTemplates";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatDetailsSidebar } from "./ChatDetailsSidebar";
import { NewConversationDialog } from "./NewConversationDialog";
import { SyncLeadsToContacts } from "./SyncLeadsToContacts";

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os canais', icon: MessageSquare },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
];

const getChannelIcon = (channel?: ChannelType) => {
  switch (channel) {
    case 'instagram':
      return <Instagram className="w-4 h-4 text-pink-500" />;
    case 'facebook':
      return <Facebook className="w-4 h-4 text-blue-600" />;
    case 'whatsapp':
    default:
      return <MessageCircle className="w-4 h-4 text-green-500" />;
  }
};

const getChannelColor = (channel?: ChannelType) => {
  switch (channel) {
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'facebook':
      return 'bg-blue-600';
    case 'whatsapp':
    default:
      return 'bg-green-500';
  }
};

interface WhatsAppConversationsProps {
  initialConversationId?: string | null;
  onConversationSelected?: () => void;
}

export function WhatsAppConversations({ initialConversationId, onConversationSelected }: WhatsAppConversationsProps = {}) {
  const {
    conversations,
    allConversations,
    loading,
    selectedConversation,
    setSelectedConversation,
    messages,
    loadingMessages,
    sendMessage,
    channelFilter,
    setChannelFilter,
    refetch,
  } = useWhatsAppConversations();
  
  const { toast } = useToast();
  const { results: searchResults, searching, search: globalSearch, clearSearch } = useGlobalMessageSearch();
  const { assigneesMap } = useAllConversationAssignees();
  const { templates } = useMessageTemplates();
  const { contacts, tags } = useWhatsAppContacts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showConversationList, setShowConversationList] = useState(true);
  
  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording, getBase64Audio } = useAudioRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle initial conversation selection
  useEffect(() => {
    if (initialConversationId && allConversations.length > 0) {
      const conversation = allConversations.find(c => c.id === initialConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        setShowConversationList(false);
        onConversationSelected?.();
      }
    }
  }, [initialConversationId, allConversations, setSelectedConversation, onConversationSelected]);

  // Get unique assignees for filter
  const allAssignees = Object.values(assigneesMap).flat();
  const uniqueAssignees = Array.from(new Map(allAssignees.map(a => [a.user_id, a])).values());

  // Get contact tags for current conversation
  const getContactTags = (phone: string) => {
    const contact = contacts.find(c => c.phone === phone);
    return contact?.tags || [];
  };

  const toggleFavorite = (convId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(convId)) {
        newSet.delete(convId);
      } else {
        newSet.add(convId);
      }
      return newSet;
    });
  };

  // Filter conversations - favorites first
  const filteredConversations = conversations
    .filter((conv) => {
      const matchesSearch = conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.contact_phone.includes(searchTerm);
      
      if (assigneeFilter === "all") return matchesSearch;
      if (assigneeFilter === "unassigned") {
        return matchesSearch && (!assigneesMap[conv.id] || assigneesMap[conv.id].length === 0);
      }
      if (assigneeFilter === "favorites") {
        return matchesSearch && favorites.has(conv.id);
      }
      return matchesSearch && assigneesMap[conv.id]?.some(a => a.user_id === assigneeFilter);
    })
    .sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      return bFav - aFav;
    });

  const toggleMessageExpand = (msgId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        newSet.add(msgId);
      }
      return newSet;
    });
  };

  const handleGlobalSearch = () => {
    if (globalSearchQuery.trim()) {
      globalSearch(globalSearchQuery);
    }
  };

  const handleSearchResultClick = (conversationId: string) => {
    const conv = allConversations.find(c => c.id === conversationId);
    if (conv) {
      setSelectedConversation(conv);
      setShowGlobalSearch(false);
      setGlobalSearchQuery("");
      clearSearch();
    }
  };

  const handleTemplateSelect = async (template: MessageTemplate) => {
    if (!selectedConversation) return;

    // For text templates, just fill the input
    if (template.file_type === "text" && template.content) {
      setNewMessage(template.content);
      return;
    }

    // For file templates, send the file directly
    if (template.file_url) {
      setSendingFile(true);
      try {
        const { error } = await supabase.functions.invoke("zapi-send-message", {
          body: {
            conversationId: selectedConversation.id,
            phone: selectedConversation.contact_phone,
            type: template.file_type === "image" ? "image" : "document",
            fileUrl: template.file_url,
            fileName: template.file_name || "arquivo",
            caption: template.content || undefined,
          },
        });

        if (error) throw error;
        toast({ title: "Sucesso", description: "Template enviado" });
        refetch();
      } catch (error) {
        console.error("Error sending template:", error);
        toast({ title: "Erro", description: "Não foi possível enviar o template", variant: "destructive" });
      } finally {
        setSendingFile(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setSendingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const isImage = file.type.startsWith("image/");
        const isDocument = !isImage;

        const { error } = await supabase.functions.invoke("zapi-send-message", {
          body: {
            conversationId: selectedConversation.id,
            phone: selectedConversation.contact_phone,
            type: isImage ? "image" : "document",
            ...(isImage ? { image: base64 } : { document: base64, fileName: file.name }),
          },
        });

        if (error) throw error;
        toast({ title: "Sucesso", description: "Arquivo enviado" });
        refetch();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error sending file:", error);
      toast({ title: "Erro", description: "Não foi possível enviar o arquivo", variant: "destructive" });
    } finally {
      setSendingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Check if conversation was active in last 5 minutes
  const isOnline = (lastMessageAt: string | null) => {
    if (!lastMessageAt) return false;
    const diff = Date.now() - new Date(lastMessageAt).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    
    setSending(true);
    await sendMessage(selectedConversation.id, newMessage, selectedConversation);
    setNewMessage("");
    setSending(false);
  };

  const handleSendAudio = async () => {
    if (!selectedConversation || !audioBlob) return;

    setSendingAudio(true);
    try {
      const base64Audio = await getBase64Audio();
      if (!base64Audio) throw new Error("Failed to get audio data");

      const { error } = await supabase.functions.invoke("zapi-send-message", {
        body: {
          conversationId: selectedConversation.id,
          phone: selectedConversation.contact_phone,
          type: "audio",
          audio: base64Audio,
        },
      });

      if (error) throw error;

      clearRecording();
      toast({ title: "Sucesso", description: "Áudio enviado com sucesso" });
    } catch (error) {
      console.error("Error sending audio:", error);
      toast({ title: "Erro", description: "Não foi possível enviar o áudio", variant: "destructive" });
    } finally {
      setSendingAudio(false);
    }
  };

  const playRecordedAudio = () => {
    if (audioBlob && audioRef.current) {
      audioRef.current.src = URL.createObjectURL(audioBlob);
      audioRef.current.play();
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
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] gap-0 border rounded-lg overflow-hidden bg-background">
      {/* Global Search Dialog */}
      <Dialog open={showGlobalSearch} onOpenChange={setShowGlobalSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Busca Global em Mensagens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar palavras nas conversas..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleGlobalSearch()}
              />
              <Button onClick={handleGlobalSearch} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {globalSearchQuery ? "Nenhum resultado encontrado" : "Digite para buscar"}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.message_id}
                      onClick={() => handleSearchResultClick(result.conversation_id)}
                      className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{result.contact_name || result.contact_phone}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversations List - Hidden on mobile when conversation is selected */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 flex flex-col border-r bg-card",
        selectedConversation && !showConversationList ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 space-y-2 border-b">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversas
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowGlobalSearch(true)} title="Busca global">
                <SearchIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <NewConversationDialog onConversationCreated={(convId) => {
              refetch();
              const conv = allConversations.find(c => c.id === convId);
              if (conv) setSelectedConversation(conv);
            }} />
            <SyncLeadsToContacts />
          </div>
          <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as ChannelType | 'all')}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full h-8 text-xs">
              <Users className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="favorites">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  Favoritos
                </span>
              </SelectItem>
              <SelectItem value="unassigned">Sem responsável</SelectItem>
              {uniqueAssignees.map((assignee) => (
                <SelectItem key={assignee.user_id} value={assignee.user_id}>
                  {assignee.user_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
                <p className="text-sm">As conversas do WhatsApp aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setShowConversationList(false);
                    }}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          {conv.profile_picture_url ? (
                            <AvatarImage src={conv.profile_picture_url} />
                          ) : null}
                          <AvatarFallback className="text-sm">
                            {conv.contact_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <Circle className={cn(
                          "absolute -top-0.5 -right-0.5 w-3 h-3",
                          isOnline(conv.last_message_at) ? "text-green-500 fill-green-500" : "text-muted-foreground fill-muted"
                        )} />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                          getChannelColor(conv.channel)
                        )}>
                          {getChannelIcon(conv.channel)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {favorites.has(conv.id) && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate text-sm">
                              {conv.contact_name || formatPhone(conv.contact_phone)}
                            </span>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge variant="default" className="ml-2 text-xs h-5">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        {assigneesMap[conv.id] && assigneesMap[conv.id].length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">
                              {assigneesMap[conv.id].map(a => a.user_name).join(", ")}
                            </span>
                          </div>
                        )}
                        {conv.last_message_at && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Messages - Hidden on mobile when showing conversation list */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-card",
        !selectedConversation ? "hidden md:flex" : "flex",
        selectedConversation && showConversationList ? "hidden md:flex" : ""
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowConversationList(true)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="relative">
                  <Avatar>
                    {selectedConversation.profile_picture_url ? (
                      <AvatarImage src={selectedConversation.profile_picture_url} />
                    ) : null}
                    <AvatarFallback>
                      {selectedConversation.contact_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                    getChannelColor(selectedConversation.channel)
                  )}>
                    {getChannelIcon(selectedConversation.channel)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold truncate">
                      {selectedConversation.contact_name || formatPhone(selectedConversation.contact_phone)}
                    </h2>
                    <Badge variant="outline" className="text-xs">
                      {selectedConversation.channel?.toUpperCase() || 'WHATSAPP'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(selectedConversation.id);
                      }}
                      title={favorites.has(selectedConversation.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      {favorites.has(selectedConversation.id) ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedConversation.channel === 'whatsapp' 
                      ? formatPhone(selectedConversation.contact_phone)
                      : `ID: ${selectedConversation.channel_user_id || selectedConversation.contact_phone}`
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} title={showSidebar ? "Ocultar painel" : "Mostrar painel"}>
                {showSidebar ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
              </Button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                    <p>Nenhuma mensagem</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      // Extrair URL do áudio do conteúdo da mensagem
                      const audioUrlMatch = msg.content?.match(/\[Áudio: (https?:\/\/[^\]]+)\]/);
                      const audioUrl = audioUrlMatch ? audioUrlMatch[1] : null;
                      const displayContent = audioUrl 
                        ? msg.content.replace(/\[Áudio: https?:\/\/[^\]]+\]/, '').trim()
                        : msg.content;
                      
                      return (
                        <div key={msg.id} className="space-y-1">
                          <div
                            className={cn(
                              "flex gap-2",
                              msg.is_from_contact ? "justify-start" : "justify-end"
                            )}
                          >
                            {msg.is_from_contact && (
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">
                                  <User className="w-3 h-3" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="max-w-[70%]">
                              <div
                                className={cn(
                                  "rounded-lg px-3 py-2",
                                  msg.is_from_contact
                                    ? "bg-muted"
                                    : msg.is_ai_response
                                    ? "bg-primary/80 text-primary-foreground"
                                    : "bg-primary text-primary-foreground"
                                )}
                              >
                                {msg.is_ai_response && (
                                  <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                                    <Bot className="w-3 h-3" />
                                    <span>IA</span>
                                  </div>
                                )}
                                {msg.message_type === "audio" && (
                                  <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                                    <Mic className="w-3 h-3" />
                                    <span>Áudio</span>
                                  </div>
                                )}
                                
                                {/* Player de áudio se houver URL */}
                                {audioUrl && (
                                  <div className="mb-2">
                                    <audio 
                                      controls 
                                      className="w-full max-w-[250px] h-10"
                                      preload="metadata"
                                    >
                                      <source src={audioUrl} type="audio/ogg" />
                                      <source src={audioUrl} type="audio/mpeg" />
                                      Seu navegador não suporta o player de áudio.
                                    </audio>
                                  </div>
                                )}
                                
                                {/* Mostrar conteúdo apenas se não for só a URL do áudio */}
                                {displayContent && (
                                  <p className="whitespace-pre-wrap text-sm">{displayContent}</p>
                                )}
                                
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <p className="text-xs opacity-70">
                                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  {!msg.is_from_contact && (
                                    <button
                                      onClick={() => toggleMessageExpand(msg.id)}
                                      className="opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                      {expandedMessages.has(msg.id) ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Expandable sender info */}
                              {expandedMessages.has(msg.id) && !msg.is_from_contact && (
                                <div className="mt-1 px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>
                                      {msg.is_ai_response 
                                        ? "Assistente IA" 
                                        : (msg as any).sent_by_user_name || "Usuário manual"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {!msg.is_from_contact && !msg.is_ai_response && (
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">
                                  <User className="w-3 h-3" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 border-t space-y-3">
                {/* Audio Recording UI */}
                {(isRecording || audioBlob) && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {isRecording ? (
                      <>
                        <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                        <span className="text-sm flex-1">Gravando...</span>
                        <Button size="sm" variant="destructive" onClick={stopRecording}>
                          <Square className="w-4 h-4" />
                        </Button>
                      </>
                    ) : audioBlob ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={playRecordedAudio}>
                          <Play className="w-4 h-4" />
                        </Button>
                        <span className="text-sm flex-1">Áudio gravado</span>
                        <Button size="sm" variant="ghost" onClick={clearRecording}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button size="sm" onClick={handleSendAudio} disabled={sendingAudio}>
                          {sendingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </>
                    ) : null}
                    <audio ref={audioRef} className="hidden" />
                  </div>
                )}
                
                {/* Text Message Input */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingFile || isRecording || sending}
                    title="Anexar arquivo"
                  >
                    {sendingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </Button>
                  
                  {/* Template Selector */}
                  {templates.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={sendingFile || isRecording || sending}
                          title="Usar template"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
                        {templates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="flex items-center gap-2"
                          >
                            {template.file_type === "image" ? (
                              <Image className="w-4 h-4 text-blue-500" />
                            ) : template.file_type === "document" ? (
                              <File className="w-4 h-4 text-orange-500" />
                            ) : (
                              <FileText className="w-4 h-4 text-green-500" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-sm">{template.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{template.category}</p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={sending || isRecording}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={startRecording}
                    disabled={isRecording || !!audioBlob || sending}
                    title="Gravar áudio"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim() || isRecording}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Selecione uma conversa</p>
            <p className="text-sm">Escolha uma conversa para visualizar as mensagens</p>
          </div>
        )}
      </div>

      {/* Details Sidebar - Hidden on mobile */}
      {selectedConversation && showSidebar && (
        <div className="hidden lg:flex w-72 flex-shrink-0 border-l bg-card overflow-hidden">
          <ChatDetailsSidebar
            conversation={selectedConversation}
            onContactNameUpdated={refetch}
            onQuickResponseSelect={(content) => setNewMessage(content)}
            onDeleteConversation={() => {
              setSelectedConversation(null);
              refetch();
            }}
          />
        </div>
      )}
    </div>
  );
}
