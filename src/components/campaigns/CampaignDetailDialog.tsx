import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  MessageCircle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Send,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { CampaignWithStats } from "@/hooks/useCampaigns";
import { cn } from "@/lib/utils";

interface Recipient {
  id: string;
  lead_id: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  lead: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface CampaignDetailDialogProps {
  campaign: CampaignWithStats | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: Clock },
  enviado: { label: "Enviado", color: "bg-success/20 text-success", icon: CheckCircle2 },
  falhou: { label: "Falhou", color: "bg-destructive/20 text-destructive", icon: XCircle },
  aberto: { label: "Aberto", color: "bg-info/20 text-info", icon: MailOpen },
  clicado: { label: "Clicado", color: "bg-primary/20 text-primary", icon: Eye },
};

const PAGE_SIZE = 50;

export function CampaignDetailDialog({ campaign, open, onClose }: CampaignDetailDialogProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (open && campaign) {
      fetchRecipients();
    }
  }, [open, campaign, page, statusFilter]);

  const fetchRecipients = async () => {
    if (!campaign) return;
    
    setLoading(true);
    try {
      // Get total count
      let countQuery = supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Get paginated data
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('campaign_recipients')
        .select(`
          *,
          lead:leads(name, email, phone)
        `)
        .eq('campaign_id', campaign.id)
        .order('sent_at', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error("Error fetching recipients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = recipients.filter(r => {
    if (!searchTerm) return true;
    const name = r.lead?.name?.toLowerCase() || '';
    const email = r.lead?.email?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaign.campaign_type === 'email' ? (
              <Mail className="w-5 h-5 text-primary" />
            ) : (
              <MessageCircle className="w-5 h-5 text-success" />
            )}
            {campaign.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="recipients" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipients" className="gap-2">
              <Users className="w-4 h-4" />
              Destinatários
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Mail className="w-4 h-4" />
              Conteúdo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipients" className="flex-1 flex flex-col space-y-4 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="bg-secondary/30">
                <CardContent className="p-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xl font-bold">{campaign.total_recipients}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-success/10">
                <CardContent className="p-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-xl font-bold text-success">{campaign.sent_count}</p>
                    <p className="text-xs text-muted-foreground">Enviados</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10">
                <CardContent className="p-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-xl font-bold text-destructive">{campaign.failed_count}</p>
                    <p className="text-xs text-muted-foreground">Falhas</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-info/10">
                <CardContent className="p-3 flex items-center gap-2">
                  <MailOpen className="w-4 h-4 text-info" />
                  <div>
                    <p className="text-xl font-bold text-info">{campaign.opened_count}</p>
                    <p className="text-xs text-muted-foreground">Abertos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'enviado', 'falhou', 'aberto', 'pendente'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                  >
                    {status === 'all' ? 'Todos' : statusConfig[status]?.label || status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recipients Table */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-[350px] border rounded-md">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p>Nenhum destinatário encontrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Aberto em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecipients.map((recipient) => {
                        const config = statusConfig[recipient.status] || statusConfig.pendente;
                        const StatusIcon = config.icon;
                        
                        return (
                          <TableRow key={recipient.id}>
                            <TableCell className="font-medium">
                              {recipient.lead?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {recipient.lead?.email || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", config.color)}>
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {recipient.sent_at
                                ? format(new Date(recipient.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {recipient.opened_at
                                ? format(new Date(recipient.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Página {page} de {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-4">
              {campaign.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assunto</label>
                  <p className="text-lg font-medium">{campaign.subject}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Conteúdo</label>
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {campaign.content}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criada em</label>
                  <p>{format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                {campaign.started_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Iniciada em</label>
                    <p>{format(new Date(campaign.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                )}
                {campaign.completed_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Concluída em</label>
                    <p>{format(new Date(campaign.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}