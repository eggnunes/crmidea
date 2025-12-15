import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Briefcase, BookOpen, Target, Settings2, Webhook } from "lucide-react";
import { WhatsAppConversations } from "@/components/whatsapp/WhatsAppConversations";
import { AIProfileSettings } from "@/components/whatsapp/AIProfileSettings";
import { AIWorkSettings } from "@/components/whatsapp/AIWorkSettings";
import { AITrainingDocuments } from "@/components/whatsapp/AITrainingDocuments";
import { AIIntents } from "@/components/whatsapp/AIIntents";
import { AIConfigSettings } from "@/components/whatsapp/AIConfigSettings";
import { ZAPIWebhookSetup } from "@/components/whatsapp/ZAPIWebhookSetup";

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
        <TabsList className="grid w-full grid-cols-7 h-auto p-1">
          <TabsTrigger value="conversas" className="flex items-center gap-2 py-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Conversas</span>
          </TabsTrigger>
          <TabsTrigger value="perfil" className="flex items-center gap-2 py-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="trabalho" className="flex items-center gap-2 py-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Trabalho</span>
          </TabsTrigger>
          <TabsTrigger value="treinamentos" className="flex items-center gap-2 py-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Treinamentos</span>
          </TabsTrigger>
          <TabsTrigger value="intencoes" className="flex items-center gap-2 py-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Intenções</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2 py-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center gap-2 py-2">
            <Webhook className="w-4 h-4" />
            <span className="hidden sm:inline">Webhook</span>
          </TabsTrigger>
        </TabsList>

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
