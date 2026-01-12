import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncStatusCardProps {
  lastSync: string | undefined;
}

export function SyncStatusCard({ lastSync }: SyncStatusCardProps) {
  const hasSync = !!lastSync;
  const syncDate = lastSync ? parseISO(lastSync) : null;

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Status da Sincronização</h3>
      
      <div className="space-y-4">
        {hasSync ? (
          <>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Sincronizado</p>
                <p className="text-white/60 text-sm">
                  {syncDate && formatDistanceToNow(syncDate, { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="text-sm text-white/50">
              <p>Última sincronização:</p>
              <p className="text-white/70">
                {syncDate && format(syncDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white font-medium">Não sincronizado</p>
              <p className="text-white/60 text-sm">
                Clique em "Sincronizar" para buscar dados da App Store
              </p>
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white/70 text-sm mb-2">Dados sincronizados:</h4>
          <ul className="space-y-1 text-sm text-white/50">
            <li className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Vendas e receitas
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Avaliações e reviews
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Métricas de analytics
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
