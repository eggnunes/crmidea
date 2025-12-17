import { Lead, PRODUCTS } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PartyPopper, 
  MessageCircle,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentPurchasesCardProps {
  leads: Lead[];
}

function PurchaseRow({ lead, onSendWelcome }: { lead: Lead; onSendWelcome: (lead: Lead) => void }) {
  const product = PRODUCTS.find(p => p.id === lead.product);
  
  const productColorClasses: Record<string, string> = {
    consultoria: "border-l-consultoria bg-consultoria/5",
    "mentoria-coletiva": "border-l-mentoria bg-mentoria/5",
    "mentoria-individual": "border-l-mentoria bg-mentoria/5",
    "curso-idea": "border-l-curso bg-curso/5",
    "guia-ia": "border-l-ebook bg-ebook/5",
    "codigo-prompts": "border-l-ebook bg-ebook/5",
    "combo-ebooks": "border-l-ebook bg-ebook/5"
  };
  
  const timeAgo = formatDistanceToNow(new Date(lead.updatedAt), { 
    addSuffix: true, 
    locale: ptBR 
  });
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border border-border/50 border-l-4",
      productColorClasses[lead.product] || "border-l-success bg-success/5"
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-success/10">
          <CheckCircle className="w-4 h-4 text-success" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{lead.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{product?.shortName || 'Produto'}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        className="gap-1.5 text-success border-success/30 hover:bg-success/10"
        onClick={() => onSendWelcome(lead)}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Boas-vindas
      </Button>
    </div>
  );
}

export function RecentPurchasesCard({ leads }: RecentPurchasesCardProps) {
  const navigate = useNavigate();
  
  // Filter leads that were won (purchased) recently
  const recentPurchases = leads
    .filter(lead => 
      lead.status === 'fechado-ganho' && 
      (lead.notes?.toLowerCase().includes('compra_aprovada') || 
       lead.notes?.toLowerCase().includes('assinatura_renovada'))
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  
  const handleSendWelcome = (lead: Lead) => {
    // Navigate to WhatsApp page with the lead's phone
    if (lead.phone) {
      navigate(`/whatsapp?phone=${encodeURIComponent(lead.phone)}&welcome=true`);
    } else {
      navigate(`/leads?id=${lead.id}`);
    }
  };
  
  return (
    <Card className="glass border-border/50 border-l-4 border-l-success">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-success" />
          Compras Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentPurchases.length > 0 ? (
          <div className="space-y-2">
            {recentPurchases.map(lead => (
              <PurchaseRow 
                key={lead.id} 
                lead={lead} 
                onSendWelcome={handleSendWelcome}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <PartyPopper className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma compra recente</p>
            <p className="text-xs mt-1">Novos compradores aparecerão aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
