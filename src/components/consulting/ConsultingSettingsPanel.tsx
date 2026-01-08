import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Settings2,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { ConsultingClientsAdmin } from "./ConsultingClientsAdmin";
import { DiagnosticFormManager } from "./DiagnosticFormManager";
import { ConsultingStatsPanel } from "./ConsultingStatsPanel";

export function ConsultingSettingsPanel() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="form" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Formulário
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ConsultingClientsAdmin />
        </TabsContent>

        <TabsContent value="form">
          <DiagnosticFormManager />
        </TabsContent>

        <TabsContent value="stats">
          <ConsultingStatsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
