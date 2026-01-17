import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bot, Users, Settings2, Radio, BarChart3, Wifi, WifiOff, MessageCircle, Instagram } from "lucide-react";
import { WhatsAppConversations } from "@/components/whatsapp/WhatsAppConversations";
import { AIProfileSettings } from "@/components/whatsapp/AIProfileSettings";
import { AIWorkSettings } from "@/components/whatsapp/AIWorkSettings";
import { AITrainingDocuments } from "@/components/whatsapp/AITrainingDocuments";
import { AIIntents } from "@/components/whatsapp/AIIntents";
import { AIConfigSettings } from "@/components/whatsapp/AIConfigSettings";
import { ZAPIWebhookSetup } from "@/components/whatsapp/ZAPIWebhookSetup";
import { ContactsManager } from "@/components/whatsapp/ContactsManager";
import { QuickResponsesManager } from "@/components/whatsapp/QuickResponsesManager";
import { ScheduledMessagesManager } from "@/components/whatsapp/ScheduledMessagesManager";
import { AdvancedSettings } from "@/components/whatsapp/AdvancedSettings";
import { ChannelSettings } from "@/components/whatsapp/ChannelSettings";
import { ChannelAnalytics } from "@/components/whatsapp/ChannelAnalytics";
import { MessageTemplatesManager } from "@/components/whatsapp/MessageTemplatesManager";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState("conversas");
  const { user } = useAuth();
  const [zapiConnected, setZapiConnected] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Handle starting a conversation from contacts
  const handleStartConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setActiveTab("conversas");
  }, []);

  // Clear selected conversation when user manually navigates
  const handleConversationSelected = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  // Check Z-API connection status by calling the Z-API status endpoint
  useEffect(() => {
    const checkZapiStatus = async () => {
      if (!user) return;
      setCheckingStatus(true);
      try {
        // Try to call Z-API to check actual connection status
        const { data, error } = await supabase.functions.invoke("zapi-send-message", {
          body: { action: "check-status" },
        });
        
        if (error) {
          console.log("Z-API status check failed:", error);
          setZapiConnected(false);
        } else {
          setZapiConnected(data?.connected ?? true);
        }
      } catch {
        setZapiConnected(false);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkZapiStatus();
    const interval = setInterval(checkZapiStatus, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Atendimento</h1>
          <p className="text-muted-foreground">
            Gerencie conversas de WhatsApp, Instagram, Facebook e outros canais com IA
          </p>
        </div>
        {/* WhatsApp Connection Status */}
        <div className="flex items-center gap-2">
          {zapiConnected === null ? (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
              Verificando...
            </Badge>
          ) : zapiConnected ? (
            <Badge variant="outline" className="flex items-center gap-1.5 border-green-500/50 text-green-500">
              <Wifi className="w-3.5 h-3.5" />
              WhatsApp Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1.5 border-destructive/50 text-destructive">
              <WifiOff className="w-3.5 h-3.5" />
              WhatsApp Desconectado
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 w-max">
            <TabsTrigger value="conversas" className="flex items-center gap-2 py-2 px-3">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Conversas</span>
            </TabsTrigger>
            <TabsTrigger value="ia" className="flex items-center gap-2 py-2 px-3">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Inteligência Artificial</span>
            </TabsTrigger>
            <TabsTrigger value="contatos" className="flex items-center gap-2 py-2 px-3">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 py-2 px-3">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="canais" className="flex items-center gap-2 py-2 px-3">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Canais</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2 py-2 px-3">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="conversas" className="space-y-4">
          <Tabs defaultValue="whatsapp" className="space-y-4">
            <TabsList>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram
              </TabsTrigger>
            </TabsList>
            <TabsContent value="whatsapp">
              <WhatsAppConversations 
                initialConversationId={selectedConversationId}
                onConversationSelected={handleConversationSelected}
                channelFilterProp="whatsapp"
              />
            </TabsContent>
            <TabsContent value="instagram">
              <WhatsAppConversations 
                initialConversationId={selectedConversationId}
                onConversationSelected={handleConversationSelected}
                channelFilterProp="instagram"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Tabs defaultValue="perfil" className="space-y-4">
            <TabsList>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="trabalho">Trabalho</TabsTrigger>
              <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
              <TabsTrigger value="intencoes">Intenções</TabsTrigger>
            </TabsList>
            <TabsContent value="perfil"><AIProfileSettings /></TabsContent>
            <TabsContent value="trabalho"><AIWorkSettings /></TabsContent>
            <TabsContent value="treinamentos"><AITrainingDocuments /></TabsContent>
            <TabsContent value="intencoes"><AIIntents /></TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="contatos" className="space-y-4">
          <ContactsManager onStartConversation={handleStartConversation} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ChannelAnalytics />
        </TabsContent>

        <TabsContent value="canais" className="space-y-4">
          <ChannelSettings />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Tabs defaultValue="geral" className="space-y-4">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="avancado">Avançado</TabsTrigger>
              <TabsTrigger value="respostas">Respostas Rápidas</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
              <TabsTrigger value="webhook">Webhook</TabsTrigger>
            </TabsList>
            <TabsContent value="geral"><AIConfigSettings /></TabsContent>
            <TabsContent value="avancado"><AdvancedSettings /></TabsContent>
            <TabsContent value="respostas"><QuickResponsesManager /></TabsContent>
            <TabsContent value="templates"><MessageTemplatesManager /></TabsContent>
            <TabsContent value="agendamentos"><ScheduledMessagesManager /></TabsContent>
            <TabsContent value="webhook"><ZAPIWebhookSetup /></TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
