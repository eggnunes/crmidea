import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, CheckCircle2, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BookingTabProps {
  consultantId: string;
}

export function BookingTab({ consultantId }: BookingTabProps) {
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingUrl = async () => {
      try {
        const { data } = await supabase
          .from("consulting_settings")
          .select("calendar_booking_url")
          .eq("user_id", consultantId)
          .maybeSingle();

        setBookingUrl(data?.calendar_booking_url || null);
      } catch (error) {
        console.error("Error fetching booking URL:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingUrl();
  }, [consultantId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calendar className="w-6 h-6 text-primary" />
          Agendar uma Sessão de Consultoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {bookingUrl ? (
          <>
            <p className="text-muted-foreground">
              Clique no botão abaixo para ver os horários disponíveis e confirmar seu agendamento diretamente na agenda oficial.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Calendar, text: "Escolha a data e horário que melhor funciona para você" },
                { icon: CheckCircle2, text: "O link abrirá a agenda oficial de agendamento" },
                { icon: Mail, text: "Você receberá uma confirmação por e-mail automaticamente" },
              ].map(({ icon: Icon, text }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4"
                >
                  <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => window.open(bookingUrl, "_blank", "noopener,noreferrer")}
              >
                <Calendar className="w-5 h-5" />
                Abrir Agenda de Agendamento
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              O link de agendamento ainda não foi configurado.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com seu consultor para agendar sua próxima sessão.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
