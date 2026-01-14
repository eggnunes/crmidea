-- Tabela para armazenar histórico de relatórios de progresso
CREATE TABLE public.progress_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('admin', 'client')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metrics JSONB NOT NULL DEFAULT '{}',
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_opened BOOLEAN NOT NULL DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admin can see all reports
CREATE POLICY "Admins can view all reports"
  ON public.progress_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view their own reports"
  ON public.progress_reports
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.consulting_clients 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert reports"
  ON public.progress_reports
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update reports"
  ON public.progress_reports
  FOR UPDATE
  USING (true);

-- Index for faster queries
CREATE INDEX idx_progress_reports_client_id ON public.progress_reports(client_id);
CREATE INDEX idx_progress_reports_sent_at ON public.progress_reports(sent_at DESC);
CREATE INDEX idx_progress_reports_type ON public.progress_reports(report_type);