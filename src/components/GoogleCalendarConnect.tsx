import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Loader2, Unlink } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

export function GoogleCalendarConnect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isConnected, loading, connect, disconnect, handleCallback } = useGoogleCalendar();
  const callbackProcessed = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const isGoogleCallback = searchParams.get('google_callback');

    if (code && isGoogleCallback && !callbackProcessed.current) {
      callbackProcessed.current = true;
      handleCallback(code).then(() => {
        searchParams.delete('code');
        searchParams.delete('google_callback');
        searchParams.delete('scope');
        setSearchParams(searchParams);
      });
    }
  }, [searchParams, handleCallback, setSearchParams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Conecte sua conta do Google Calendar para sincronizar sessões e eventos automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando conexão...
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Conectado ao Google Calendar</span>
            </div>
            <Button
              variant="outline"
              onClick={disconnect}
              className="gap-2"
            >
              <Unlink className="h-4 w-4" />
              Desconectar
            </Button>
          </div>
        ) : (
          <Button onClick={connect} className="gap-2">
            <Calendar className="h-4 w-4" />
            Conectar Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
