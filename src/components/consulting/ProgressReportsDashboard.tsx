import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Mail, 
  MailOpen, 
  Clock, 
  Users, 
  BarChart3,
  RefreshCw,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useProgressReports } from "@/hooks/useProgressReports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ProgressReportsDashboard() {
  const { 
    reports, 
    adminReports, 
    clientReports, 
    isLoading, 
    refetch,
    sendReportNow,
    stats 
  } = useProgressReports();

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSendNow = async (type: 'all' | 'admin' | 'clients') => {
    await sendReportNow.mutateAsync({
      sendAdminReport: type === 'all' || type === 'admin',
      sendClientReports: type === 'all' || type === 'clients',
      testMode: false
    });
  };

  const handlePreview = async () => {
    try {
      const result = await sendReportNow.mutateAsync({
        sendAdminReport: true,
        sendClientReports: true,
        testMode: true
      });
      if (result.adminEmailHtml) {
        setPreviewHtml(result.adminEmailHtml);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const getStatusBadge = (metrics: any) => {
    if (!metrics?.status) return null;
    const statusConfig = {
      'ativo': { label: 'Ativo', class: 'bg-green-100 text-green-700' },
      'inativo': { label: 'Inativo', class: 'bg-yellow-100 text-yellow-700' },
      'travado': { label: 'Travado', class: 'bg-red-100 text-red-700' },
      'completo': { label: 'Concluído', class: 'bg-blue-100 text-blue-700' }
    };
    const config = statusConfig[metrics.status as keyof typeof statusConfig];
    if (!config) return null;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Carregando relatórios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Relatórios de Progresso
              </CardTitle>
              <CardDescription>
                Acompanhe e envie relatórios semanais para clientes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreview} disabled={sendReportNow.isPending}>
                <Eye className="w-4 h-4 mr-2" />
                Pré-visualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalReportsSent}</div>
              <div className="text-xs text-muted-foreground">Relatórios Enviados</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.emailOpenRate}%</div>
              <div className="text-xs text-muted-foreground">Taxa de Abertura</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.adminReportsCount}</div>
              <div className="text-xs text-muted-foreground">Relatórios Admin</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.clientReportsCount}</div>
              <div className="text-xs text-muted-foreground">Relatórios Clientes</div>
            </div>
          </div>

          {/* Send Now Buttons */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium mr-2 self-center">Enviar agora:</span>
            <Button 
              size="sm" 
              onClick={() => handleSendNow('all')}
              disabled={sendReportNow.isPending}
            >
              {sendReportNow.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Todos os Relatórios
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleSendNow('admin')}
              disabled={sendReportNow.isPending}
            >
              Só Admin
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleSendNow('clients')}
              disabled={sendReportNow.isPending}
            >
              Só Clientes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && previewHtml && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pré-visualização do Email</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </CardContent>
        </Card>
      )}

      {/* Reports History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos ({reports?.length || 0})</TabsTrigger>
              <TabsTrigger value="admin">Admin ({adminReports.length})</TabsTrigger>
              <TabsTrigger value="clients">Clientes ({clientReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ReportsList reports={reports || []} getStatusBadge={getStatusBadge} />
            </TabsContent>
            <TabsContent value="admin">
              <ReportsList reports={adminReports} getStatusBadge={getStatusBadge} />
            </TabsContent>
            <TabsContent value="clients">
              <ReportsList reports={clientReports} getStatusBadge={getStatusBadge} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface ReportsListProps {
  reports: any[];
  getStatusBadge: (metrics: any) => JSX.Element | null;
}

function ReportsList({ reports, getStatusBadge }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum relatório enviado ainda</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {reports.map((report) => (
          <div 
            key={report.id}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={`p-2 rounded-full ${report.email_opened ? 'bg-green-100' : 'bg-muted'}`}>
              {report.email_opened ? (
                <MailOpen className="w-4 h-4 text-green-600" />
              ) : (
                <Mail className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {report.report_type === 'admin' 
                    ? 'Relatório Admin' 
                    : report.metrics?.clientName || 'Cliente'}
                </span>
                <Badge variant={report.report_type === 'admin' ? 'default' : 'secondary'}>
                  {report.report_type === 'admin' ? 'Admin' : 'Cliente'}
                </Badge>
                {getStatusBadge(report.metrics)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(report.sent_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                {report.report_type === 'client' && report.metrics?.completionPercent !== undefined && (
                  <>
                    <span>•</span>
                    <span>{report.metrics.completionPercent}% concluído</span>
                  </>
                )}
                {report.email_sent && (
                  <>
                    <span>•</span>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Enviado</span>
                  </>
                )}
              </div>
            </div>

            {report.report_type === 'admin' && report.metrics && (
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {report.metrics.totalClients || 0} clientes
                </div>
                {(report.metrics.stuckClients || 0) > 0 && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-3 h-3" />
                    {report.metrics.stuckClients} travados
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
