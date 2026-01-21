import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SyncHistoryButton() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [limit, setLimit] = useState("30");

  const handleSync = async (syncAll: boolean) => {
    setSyncing(true);
    try {
      const body: { phone?: string; limit?: number } = {};
      
      if (!syncAll && phone.trim()) {
        body.phone = phone.trim().replace(/\D/g, '');
      }
      
      body.limit = parseInt(limit) || 30;

      const { data, error } = await supabase.functions.invoke("zapi-sync-history", {
        body,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sincronização concluída!",
          description: `${data.syncedMessages} mensagens sincronizadas de ${data.conversationsProcessed} conversas.`,
        });
        setOpen(false);
        setPhone("");
      } else {
        throw new Error(data.error || "Falha na sincronização");
      }
    } catch (error) {
      console.error("Error syncing history:", error);
      toast({
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Não foi possível sincronizar o histórico",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Sincronizar Histórico</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Sincronizar Histórico do WhatsApp
          </DialogTitle>
          <DialogDescription>
            Importe conversas e mensagens antigas do WhatsApp que não passaram pelo webhook.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone específico (opcional)</Label>
            <Input
              id="phone"
              placeholder="Ex: 5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={syncing}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para sincronizar todas as conversas recentes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite de conversas</Label>
            <Input
              id="limit"
              type="number"
              placeholder="30"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              disabled={syncing}
              min={1}
              max={100}
            />
            <p className="text-xs text-muted-foreground">
              Máximo de conversas a sincronizar (1-100)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            {phone.trim() ? (
              <Button
                onClick={() => handleSync(false)}
                disabled={syncing}
                className="flex-1"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sincronizar Contato
              </Button>
            ) : (
              <Button
                onClick={() => handleSync(true)}
                disabled={syncing}
                className="flex-1"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sincronizar Todas
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
