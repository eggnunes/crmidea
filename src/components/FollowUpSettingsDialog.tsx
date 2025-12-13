import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFollowUpSettings } from '@/hooks/useFollowUpSettings';

export function FollowUpSettingsDialog() {
  const { settings, loading, saveSettings } = useFollowUpSettings();
  const [open, setOpen] = useState(false);
  const [daysWithoutInteraction, setDaysWithoutInteraction] = useState(7);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [manychatSubscriberId, setManychatSubscriberId] = useState('');

  useEffect(() => {
    if (settings) {
      setDaysWithoutInteraction(settings.days_without_interaction);
      setNotifyInApp(settings.notify_in_app);
      setNotifyWhatsapp(settings.notify_whatsapp);
      setManychatSubscriberId(settings.manychat_subscriber_id || '');
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings({
      days_without_interaction: daysWithoutInteraction,
      notify_in_app: notifyInApp,
      notify_whatsapp: notifyWhatsapp,
      manychat_subscriber_id: manychatSubscriberId || null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Follow-up</DialogTitle>
          <DialogDescription>
            Configure quando e como você deseja receber alertas de follow-up.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="days">Dias sem interação para alerta</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={365}
              value={daysWithoutInteraction}
              onChange={(e) => setDaysWithoutInteraction(parseInt(e.target.value) || 7)}
            />
            <p className="text-sm text-muted-foreground">
              Você receberá um alerta quando um lead ficar esse número de dias sem interação.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações no app</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas dentro do CRM
              </p>
            </div>
            <Switch
              checked={notifyInApp}
              onCheckedChange={setNotifyInApp}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas via ManyChat/WhatsApp
              </p>
            </div>
            <Switch
              checked={notifyWhatsapp}
              onCheckedChange={setNotifyWhatsapp}
            />
          </div>

          {notifyWhatsapp && (
            <div className="grid gap-2">
              <Label htmlFor="subscriber">ManyChat Subscriber ID</Label>
              <Input
                id="subscriber"
                value={manychatSubscriberId}
                onChange={(e) => setManychatSubscriberId(e.target.value)}
                placeholder="Ex: 123456789"
              />
              <p className="text-sm text-muted-foreground">
                Seu ID de assinante no ManyChat. Você pode encontrar isso no painel do ManyChat.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}