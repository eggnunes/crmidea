import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsExportProps {
  dateRange: { start: Date; end: Date };
}

export function AnalyticsExport({ dateRange }: AnalyticsExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAnalyticsData = async () => {
    if (!user) return null;

    const startDateStr = dateRange.start.toISOString();
    const endDateStr = dateRange.end.toISOString();

    // Fetch conversations
    const { data: conversations } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    // Fetch messages
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    // Fetch leads
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    // Calculate metrics
    const channelMetrics: Record<string, { messages: number; conversations: number; aiResponses: number }> = {};
    
    conversations?.forEach(conv => {
      if (!channelMetrics[conv.channel]) {
        channelMetrics[conv.channel] = { messages: 0, conversations: 0, aiResponses: 0 };
      }
      channelMetrics[conv.channel].conversations++;
    });

    messages?.forEach(msg => {
      if (!channelMetrics[msg.channel]) {
        channelMetrics[msg.channel] = { messages: 0, conversations: 0, aiResponses: 0 };
      }
      channelMetrics[msg.channel].messages++;
      if (msg.is_ai_response) {
        channelMetrics[msg.channel].aiResponses++;
      }
    });

    // Daily breakdown
    const dailyStats: Record<string, { date: string; messages: number; conversations: number; leads: number }> = {};
    
    messages?.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('pt-BR');
      if (!dailyStats[date]) {
        dailyStats[date] = { date, messages: 0, conversations: 0, leads: 0 };
      }
      dailyStats[date].messages++;
    });

    conversations?.forEach(conv => {
      const date = new Date(conv.created_at).toLocaleDateString('pt-BR');
      if (!dailyStats[date]) {
        dailyStats[date] = { date, messages: 0, conversations: 0, leads: 0 };
      }
      dailyStats[date].conversations++;
    });

    leads?.forEach(lead => {
      const date = new Date(lead.created_at).toLocaleDateString('pt-BR');
      if (!dailyStats[date]) {
        dailyStats[date] = { date, messages: 0, conversations: 0, leads: 0 };
      }
      dailyStats[date].leads++;
    });

    return {
      summary: {
        totalConversations: conversations?.length || 0,
        totalMessages: messages?.length || 0,
        totalAIResponses: messages?.filter(m => m.is_ai_response).length || 0,
        totalLeads: leads?.length || 0,
        dateRange: `${dateRange.start.toLocaleDateString('pt-BR')} - ${dateRange.end.toLocaleDateString('pt-BR')}`,
      },
      channelMetrics: Object.entries(channelMetrics).map(([channel, data]) => ({
        canal: channel,
        conversas: data.conversations,
        mensagens: data.messages,
        respostasIA: data.aiResponses,
      })),
      dailyStats: Object.values(dailyStats).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      }),
      conversations: conversations?.map(c => ({
        contato: c.contact_name || c.contact_phone,
        canal: c.channel,
        mensagensNaoLidas: c.unread_count,
        ultimaMensagem: c.last_message_at ? new Date(c.last_message_at).toLocaleString('pt-BR') : '',
        criadoEm: new Date(c.created_at).toLocaleString('pt-BR'),
      })) || [],
      leads: leads?.map(l => ({
        nome: l.name,
        email: l.email,
        telefone: l.phone || '',
        produto: l.product,
        status: l.status,
        valor: l.value || 0,
        origem: l.source || '',
        criadoEm: new Date(l.created_at).toLocaleString('pt-BR'),
      })) || [],
    };
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const data = await fetchAnalyticsData();
      if (!data) {
        throw new Error('Não foi possível carregar os dados');
      }

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Relatório de Analytics'],
        ['Período', data.summary.dateRange],
        [''],
        ['Métrica', 'Valor'],
        ['Total de Conversas', data.summary.totalConversations],
        ['Total de Mensagens', data.summary.totalMessages],
        ['Respostas da IA', data.summary.totalAIResponses],
        ['Novos Leads', data.summary.totalLeads],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

      // Channel metrics sheet
      if (data.channelMetrics.length > 0) {
        const wsChannels = XLSX.utils.json_to_sheet(data.channelMetrics);
        XLSX.utils.book_append_sheet(wb, wsChannels, 'Por Canal');
      }

      // Daily stats sheet
      if (data.dailyStats.length > 0) {
        const wsDaily = XLSX.utils.json_to_sheet(data.dailyStats);
        XLSX.utils.book_append_sheet(wb, wsDaily, 'Por Dia');
      }

      // Conversations sheet
      if (data.conversations.length > 0) {
        const wsConversations = XLSX.utils.json_to_sheet(data.conversations);
        XLSX.utils.book_append_sheet(wb, wsConversations, 'Conversas');
      }

      // Leads sheet
      if (data.leads.length > 0) {
        const wsLeads = XLSX.utils.json_to_sheet(data.leads);
        XLSX.utils.book_append_sheet(wb, wsLeads, 'Leads');
      }

      XLSX.writeFile(wb, `analytics_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Exportação concluída',
        description: 'Arquivo Excel baixado com sucesso',
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const data = await fetchAnalyticsData();
      if (!data) {
        throw new Error('Não foi possível carregar os dados');
      }

      // Create PDF content as HTML and print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup bloqueado. Permita popups para exportar PDF.');
      }

      const channelRows = data.channelMetrics
        .map(c => `<tr><td>${c.canal}</td><td>${c.conversas}</td><td>${c.mensagens}</td><td>${c.respostasIA}</td></tr>`)
        .join('');

      const dailyRows = data.dailyStats
        .map(d => `<tr><td>${d.date}</td><td>${d.messages}</td><td>${d.conversations}</td><td>${d.leads}</td></tr>`)
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Analytics</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            h2 { color: #444; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #007bff; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px; }
            .summary-card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
            .summary-card p { margin: 0; font-size: 28px; font-weight: bold; color: #1a1a1a; }
            .date-range { color: #666; margin-bottom: 30px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>📊 Relatório de Analytics</h1>
          <p class="date-range">Período: ${data.summary.dateRange}</p>
          
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total de Conversas</h3>
              <p>${data.summary.totalConversations}</p>
            </div>
            <div class="summary-card">
              <h3>Total de Mensagens</h3>
              <p>${data.summary.totalMessages}</p>
            </div>
            <div class="summary-card">
              <h3>Respostas da IA</h3>
              <p>${data.summary.totalAIResponses}</p>
            </div>
            <div class="summary-card">
              <h3>Novos Leads</h3>
              <p>${data.summary.totalLeads}</p>
            </div>
          </div>
          
          <h2>Métricas por Canal</h2>
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Conversas</th>
                <th>Mensagens</th>
                <th>Respostas IA</th>
              </tr>
            </thead>
            <tbody>
              ${channelRows || '<tr><td colspan="4">Sem dados</td></tr>'}
            </tbody>
          </table>
          
          <h2>Métricas Diárias</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Mensagens</th>
                <th>Conversas</th>
                <th>Leads</th>
              </tr>
            </thead>
            <tbody>
              ${dailyRows || '<tr><td colspan="4">Sem dados</td></tr>'}
            </tbody>
          </table>
          
          <p style="margin-top: 40px; color: #999; font-size: 12px;">
            Gerado em ${new Date().toLocaleString('pt-BR')}
          </p>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);

      toast({
        title: 'PDF pronto',
        description: 'Use a opção "Salvar como PDF" na janela de impressão',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Não foi possível exportar',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar para Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar para PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
