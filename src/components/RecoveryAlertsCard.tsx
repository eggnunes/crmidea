import { Lead, PRODUCTS } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  XCircle, 
  RefreshCcw, 
  AlertTriangle,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RecoveryAlertsCardProps {
  leads: Lead[];
}

interface AlertItem {
  lead: Lead;
  type: 'carrinho' | 'recusada' | 'reembolso' | 'chargeback';
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  urgency: 'alta' | 'media' | 'baixa';
}

function getAlertType(lead: Lead): AlertItem | null {
  const notes = lead.notes?.toLowerCase() || '';
  
  if (notes.includes('carrinho_abandonado') || notes.includes('carrinho abandonado')) {
    return {
      lead,
      type: 'carrinho',
      icon: ShoppingCart,
      label: 'Carrinho Abandonado',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      urgency: 'alta'
    };
  }
  
  if (notes.includes('compra_recusada') || notes.includes('compra recusada')) {
    return {
      lead,
      type: 'recusada',
      icon: XCircle,
      label: 'Compra Recusada',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      urgency: 'alta'
    };
  }
  
  if (notes.includes('reembolso') || notes.includes('compra_reembolsada')) {
    return {
      lead,
      type: 'reembolso',
      icon: RefreshCcw,
      label: 'Reembolso',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      urgency: 'media'
    };
  }
  
  if (notes.includes('chargeback')) {
    return {
      lead,
      type: 'chargeback',
      icon: AlertTriangle,
      label: 'Chargeback',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      urgency: 'alta'
    };
  }
  
  return null;
}

function AlertRow({ alert, onContact }: { alert: AlertItem; onContact: (lead: Lead) => void }) {
  const product = PRODUCTS.find(p => p.id === alert.lead.product);
  const Icon = alert.icon;
  
  const urgencyColors = {
    alta: 'border-l-destructive',
    media: 'border-l-warning',
    baixa: 'border-l-info'
  };
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border border-border/50 border-l-4",
      urgencyColors[alert.urgency],
      alert.bgColor
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", alert.bgColor)}>
          <Icon className={cn("w-4 h-4", alert.color)} />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{alert.lead.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{product?.shortName || 'Produto'}</span>
            <span>•</span>
            <Badge variant="outline" className={cn("text-xs py-0", alert.color, alert.bgColor)}>
              {alert.label}
            </Badge>
          </div>
        </div>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        className="gap-1.5"
        onClick={() => onContact(alert.lead)}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Contatar
      </Button>
    </div>
  );
}

export function RecoveryAlertsCard({ leads }: RecoveryAlertsCardProps) {
  const navigate = useNavigate();
  
  // Get alerts from leads based on their notes (events from Kiwify)
  const alerts: AlertItem[] = leads
    .map(lead => getAlertType(lead))
    .filter((alert): alert is AlertItem => alert !== null)
    .sort((a, b) => {
      // Sort by urgency then by date
      const urgencyOrder = { alta: 0, media: 1, baixa: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return new Date(b.lead.updatedAt).getTime() - new Date(a.lead.updatedAt).getTime();
    })
    .slice(0, 5);
  
  const handleContact = (lead: Lead) => {
    // Navigate to WhatsApp page with the lead's phone
    if (lead.phone) {
      navigate(`/whatsapp?phone=${encodeURIComponent(lead.phone)}`);
    } else {
      navigate(`/leads?id=${lead.id}`);
    }
  };
  
  const totalAlerts = leads.filter(lead => getAlertType(lead) !== null).length;
  
  return (
    <Card className="glass border-border/50 border-l-4 border-l-destructive">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Alertas de Recuperação
          </CardTitle>
          {totalAlerts > 5 && (
            <Badge variant="destructive" className="text-xs">
              +{totalAlerts - 5} mais
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map(alert => (
              <AlertRow 
                key={alert.lead.id} 
                alert={alert} 
                onContact={handleContact}
              />
            ))}
            {totalAlerts > 5 && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/leads')}
              >
                Ver todos os alertas
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum alerta de recuperação</p>
            <p className="text-xs mt-1">Leads com problemas aparecerão aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
