import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_name: string;
  created_at: string;
  status: string | null;
  num_lawyers: number;
  num_employees: number;
  practice_areas: string | null;
}

interface Props {
  client: ClientData;
}

export function ClientReportPDF({ client }: Props) {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);

    try {
      // Fetch sessions
      const { data: sessions } = await supabase
        .from("consulting_sessions")
        .select("*")
        .eq("client_id", client.id)
        .order("session_date", { ascending: false });

      // Fetch feedback
      const { data: feedback } = await supabase
        .from("client_progress_feedback")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch earned badges
      const { data: earnedBadges } = await supabase
        .from("client_earned_badges")
        .select(`
          id,
          earned_at,
          badge:client_badges(name, points)
        `)
        .eq("client_id", client.id);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Helper function
      const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; color?: number[] }) => {
        if (options?.fontSize) doc.setFontSize(options.fontSize);
        if (options?.fontStyle) doc.setFont("helvetica", options.fontStyle);
        if (options?.color) doc.setTextColor(options.color[0], options.color[1], options.color[2]);
        else doc.setTextColor(0, 0, 0);
        doc.text(text, x, y);
        return y;
      };

      // Header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 40, "F");
      
      addText("RELATÓRIO DE PROGRESSO", pageWidth / 2, 18, { fontSize: 18, fontStyle: "bold", color: [255, 255, 255] });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("Consultoria IDEA", pageWidth / 2, 28, { align: "center" });
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 35, { align: "center" });

      yPos = 55;

      // Client Info
      addText("INFORMAÇÕES DO CLIENTE", 20, yPos, { fontSize: 14, fontStyle: "bold", color: [99, 102, 241] });
      yPos += 10;
      
      doc.setDrawColor(99, 102, 241);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;

      addText(`Nome: ${client.full_name}`, 20, yPos, { fontSize: 11, fontStyle: "normal" });
      yPos += 6;
      addText(`Escritório: ${client.office_name}`, 20, yPos, { fontSize: 11 });
      yPos += 6;
      addText(`Email: ${client.email}`, 20, yPos, { fontSize: 11 });
      yPos += 6;
      addText(`Telefone: ${client.phone}`, 20, yPos, { fontSize: 11 });
      yPos += 6;
      addText(`Equipe: ${client.num_lawyers} advogado(s), ${client.num_employees} colaborador(es)`, 20, yPos, { fontSize: 11 });
      yPos += 6;
      
      const daysInConsulting = differenceInDays(new Date(), new Date(client.created_at));
      addText(`Dias na consultoria: ${daysInConsulting}`, 20, yPos, { fontSize: 11 });
      yPos += 15;

      // Sessions Summary
      addText("HISTÓRICO DE REUNIÕES", 20, yPos, { fontSize: 14, fontStyle: "bold", color: [99, 102, 241] });
      yPos += 10;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;

      const completedSessions = sessions?.filter(s => s.status === "completed") || [];
      const scheduledSessions = sessions?.filter(s => s.status === "scheduled") || [];

      addText(`Total de reuniões realizadas: ${completedSessions.length}`, 20, yPos, { fontSize: 11, fontStyle: "normal" });
      yPos += 6;
      addText(`Reuniões agendadas: ${scheduledSessions.length}`, 20, yPos, { fontSize: 11 });
      yPos += 10;

      if (completedSessions.length > 0) {
        addText("Últimas reuniões:", 20, yPos, { fontSize: 11, fontStyle: "bold" });
        yPos += 6;

        completedSessions.slice(0, 5).forEach((session) => {
          const sessionDate = format(new Date(session.session_date), "dd/MM/yyyy", { locale: ptBR });
          addText(`• ${sessionDate} - ${session.title}`, 25, yPos, { fontSize: 10 });
          yPos += 5;
          if (session.summary) {
            const summaryLines = doc.splitTextToSize(`  Resumo: ${session.summary}`, pageWidth - 50);
            summaryLines.forEach((line: string) => {
              addText(line, 30, yPos, { fontSize: 9, color: [100, 100, 100] });
              yPos += 4;
            });
          }
          yPos += 2;
        });
      }
      yPos += 5;

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Progress Feedback
      addText("ATUALIZAÇÕES DE PROGRESSO", 20, yPos, { fontSize: 14, fontStyle: "bold", color: [99, 102, 241] });
      yPos += 10;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;

      const statusLabels: Record<string, string> = {
        not_started: "Não iniciado",
        in_progress: "Em andamento",
        completed: "Concluído",
        blocked: "Travado",
      };

      if (feedback && feedback.length > 0) {
        feedback.forEach((f: any) => {
          const feedbackDate = format(new Date(f.created_at), "dd/MM/yyyy", { locale: ptBR });
          addText(`${feedbackDate} - ${statusLabels[f.implementation_status] || f.implementation_status}`, 20, yPos, { fontSize: 10, fontStyle: "bold" });
          yPos += 5;
          
          if (f.achievements) {
            addText(`  Conquistas: ${f.achievements}`, 25, yPos, { fontSize: 9 });
            yPos += 4;
          }
          if (f.main_challenges) {
            addText(`  Desafios: ${f.main_challenges}`, 25, yPos, { fontSize: 9 });
            yPos += 4;
          }
          yPos += 3;

          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
      } else {
        addText("Nenhuma atualização de progresso registrada.", 20, yPos, { fontSize: 10, color: [100, 100, 100] });
        yPos += 10;
      }

      // Badges
      if (earnedBadges && earnedBadges.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        addText("CONQUISTAS", 20, yPos, { fontSize: 14, fontStyle: "bold", color: [99, 102, 241] });
        yPos += 10;
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 8;

        const totalPoints = earnedBadges.reduce((sum, eb: any) => sum + (eb.badge?.points || 0), 0);
        addText(`Total de pontos: ${totalPoints}`, 20, yPos, { fontSize: 11, fontStyle: "bold" });
        yPos += 6;

        earnedBadges.forEach((eb: any) => {
          const earnedDate = format(new Date(eb.earned_at), "dd/MM/yyyy", { locale: ptBR });
          addText(`🏆 ${eb.badge?.name} (+${eb.badge?.points} pts) - ${earnedDate}`, 25, yPos, { fontSize: 10 });
          yPos += 5;
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: "center" });
        doc.text("Consultoria IDEA - Inteligência Artificial para Escritórios de Advocacia", pageWidth / 2, 295, { align: "center" });
      }

      // Save
      const fileName = `relatorio_${client.full_name.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(fileName);

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={generateReport} disabled={generating} variant="outline" className="gap-2">
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Exportar PDF
    </Button>
  );
}
