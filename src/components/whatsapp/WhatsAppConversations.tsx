import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Send, MessageSquare, User, Bot, Mic, Square, Play, Trash2 } from "lucide-react";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function WhatsAppConversations() {
  const {
    conversations,
    loading,
    selectedConversation,
    setSelectedConversation,
    messages,
    loadingMessages,
    sendMessage,
  } = useWhatsAppConversations();
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording, getBase64Audio } = useAudioRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contact_phone.includes(searchTerm)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    
    setSending(true);
    await sendMessage(selectedConversation.id, newMessage);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)]">
      {/* Conversations List */}
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversas
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
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
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {conv.contact_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">
                            {conv.contact_name || formatPhone(conv.contact_phone)}
                          </span>
                          {conv.unread_count > 0 && (
                            <Badge variant="default" className="ml-2">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {formatPhone(conv.contact_phone)}
                        </p>
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
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedConversation.contact_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {selectedConversation.contact_name || formatPhone(selectedConversation.contact_phone)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(selectedConversation.contact_phone)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
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
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          msg.is_from_contact ? "justify-start" : "justify-end"
                        )}
                      >
                        {msg.is_from_contact && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
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
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!msg.is_from_contact && !msg.is_ai_response && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
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
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={sending || isRecording}
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
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Selecione uma conversa</p>
            <p className="text-sm">Escolha uma conversa para visualizar as mensagens</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
