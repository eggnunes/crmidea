import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";
import { 
  GoogleCalendarEvents, 
  CreateMeetingDialog, 
  CalendarSelector,
  AvailabilityManager 
} from "@/components/calendar";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Calendar, CalendarPlus, Clock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CalendarPage() {
  const { isConnected } = useGoogleCalendar();

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/agendar`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
            <p className="text-muted-foreground">
              Gerencie reuniões, disponibilidade e agendamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyPublicLink}>
              <Link2 className="w-4 h-4 mr-2" />
              Copiar Link Público
            </Button>
            {isConnected && <CreateMeetingDialog />}
          </div>
        </div>

        <GoogleCalendarConnect />

        {isConnected ? (
          <Tabs defaultValue="eventos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="eventos" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Eventos
              </TabsTrigger>
              <TabsTrigger value="disponibilidade" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Disponibilidade
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="eventos">
              <GoogleCalendarEvents />
            </TabsContent>

            <TabsContent value="disponibilidade">
              <AvailabilityManager />
            </TabsContent>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Calendário</CardTitle>
                  <CardDescription>
                    Selecione qual calendário usar para agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarSelector />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Conecte seu Google Calendar</CardTitle>
              <CardDescription>
                Para usar todas as funcionalidades de agendamento, conecte sua conta do Google Calendar acima.
              </CardDescription>
            </CardHeader>
      </Card>
    )}
  </div>
  );
}
