import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Briefcase, BookOpen, Target, Settings2, Webhook, Users, Zap, Clock, Sliders } from "lucide-react";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState("conversas");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp IA</h1>
        <p className="text-muted-foreground">
          Configure seu assistente de IA e visualize as conversas do WhatsApp
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 w-max">
            <TabsTrigger value="conversas" className="flex items-center gap-2 py-2 px-3">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Conversas</span>
            </TabsTrigger>
            <TabsTrigger value="perfil" className="flex items-center gap-2 py-2 px-3">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="trabalho" className="flex items-center gap-2 py-2 px-3">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Trabalho</span>
            </TabsTrigger>
            <TabsTrigger value="treinamentos" className="flex items-center gap-2 py-2 px-3">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Treinamentos</span>
            </TabsTrigger>
            <TabsTrigger value="intencoes" className="flex items-center gap-2 py-2 px-3">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Intenções</span>
            </TabsTrigger>
            <TabsTrigger value="contatos" className="flex items-center gap-2 py-2 px-3">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="respostas" className="flex items-center gap-2 py-2 px-3">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Respostas Rápidas</span>
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="flex items-center gap-2 py-2 px-3">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Agendamentos</span>
            </TabsTrigger>
            <TabsTrigger value="avancado" className="flex items-center gap-2 py-2 px-3">
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Avançado</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2 py-2 px-3">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2 py-2 px-3">
              <Webhook className="w-4 h-4" />
              <span className="hidden sm:inline">Webhook</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="conversas" className="space-y-4">
          <WhatsAppConversations />
        </TabsContent>

        <TabsContent value="perfil" className="space-y-4">
          <AIProfileSettings />
        </TabsContent>

        <TabsContent value="trabalho" className="space-y-4">
          <AIWorkSettings />
        </TabsContent>

        <TabsContent value="treinamentos" className="space-y-4">
          <AITrainingDocuments />
        </TabsContent>

        <TabsContent value="intencoes" className="space-y-4">
          <AIIntents />
        </TabsContent>

        <TabsContent value="contatos" className="space-y-4">
          <ContactsManager />
        </TabsContent>

        <TabsContent value="respostas" className="space-y-4">
          <QuickResponsesManager />
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-4">
          <ScheduledMessagesManager />
        </TabsContent>

        <TabsContent value="avancado" className="space-y-4">
          <AdvancedSettings />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <AIConfigSettings />
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <ZAPIWebhookSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
