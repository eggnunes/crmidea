import { CheckCircle, ArrowRight, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DiagnosticSuccessProps {
  clientName: string;
  bookingUrl?: string;
}

const DEFAULT_BOOKING_URL = "https://calendar.app.google/QekSkCGbKjaRb3Qp8";

export function DiagnosticSuccess({ clientName, bookingUrl }: DiagnosticSuccessProps) {
  const finalBookingUrl = bookingUrl || DEFAULT_BOOKING_URL;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-500/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-2 border-green-500/30">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-600">
              Diagnóstico Enviado!
            </h1>
            <p className="text-lg">
              Obrigado, <span className="font-semibold">{clientName}</span>!
            </p>
          </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              Seu diagnóstico foi recebido com sucesso. Nossa equipe irá analisar 
              todas as informações e preparar um plano personalizado para o seu escritório.
            </p>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-3">
              <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Próximo Passo: Agendar Reunião
              </h3>
              <p className="text-sm">
                Para iniciarmos a implantação da sua intranet, agende nossa primeira reunião:
              </p>
              <Button 
                size="lg"
                className="gap-2 w-full"
                onClick={() => window.open(finalBookingUrl, "_blank")}
              >
                <Calendar className="w-4 h-4" />
                Agendar Reunião de Kickoff
              </Button>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <h3 className="font-semibold text-foreground">O que vamos fazer:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Análise detalhada do seu diagnóstico pela nossa equipe</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Geração do prompt personalizado para criação da sua intranet</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Reunião de kickoff para iniciar a implementação</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Implementação a quatro mãos com acompanhamento</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Em breve você receberá um e-mail e WhatsApp com mais detalhes.
            </p>
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
            >
              <MessageCircle className="w-4 h-4" />
              Falar pelo WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
