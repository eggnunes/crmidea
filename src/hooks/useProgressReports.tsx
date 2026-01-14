import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportMetrics {
  clientId?: string;
  clientName?: string;
  totalSteps?: number;
  completedSteps?: number;
  completionPercent?: number;
  status?: string;
  // Admin metrics
  totalClients?: number;
  completedClients?: number;
  stuckClients?: number;
  inactiveClients?: number;
  averageCompletion?: number;
  weekStart?: string;
  weekEnd?: string;
}

interface ProgressReport {
  id: string;
  client_id: string | null;
  report_type: 'admin' | 'client';
  sent_at: string;
  metrics: ReportMetrics;
  email_sent: boolean;
  email_opened: boolean;
  opened_at: string | null;
  created_at: string;
}

export function useProgressReports() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['progress-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_reports')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ProgressReport[];
    }
  });

  const sendReportNow = useMutation({
    mutationFn: async (options: { 
      sendAdminReport?: boolean; 
      sendClientReports?: boolean;
      testMode?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('weekly-progress-report', {
        body: options
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.testMode) {
        toast.success("Pré-visualização gerada com sucesso!");
      } else {
        toast.success(`Relatórios enviados! Admin: ${data.adminReportSent ? '✓' : '✗'}, Clientes: ${data.clientReportsSent}`);
      }
      queryClient.invalidateQueries({ queryKey: ['progress-reports'] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar relatórios", { description: error.message });
    }
  });

  // Group reports by type
  const adminReports = reports?.filter(r => r.report_type === 'admin') || [];
  const clientReports = reports?.filter(r => r.report_type === 'client') || [];

  // Calculate stats
  const totalReportsSent = reports?.length || 0;
  const emailOpenRate = reports?.length 
    ? Math.round((reports.filter(r => r.email_opened).length / reports.length) * 100)
    : 0;

  return {
    reports,
    adminReports,
    clientReports,
    isLoading,
    refetch,
    sendReportNow,
    stats: {
      totalReportsSent,
      emailOpenRate,
      adminReportsCount: adminReports.length,
      clientReportsCount: clientReports.length
    }
  };
}
