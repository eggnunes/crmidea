-- Table for lead assignments (multiple users can be assigned to a lead)
CREATE TABLE public.lead_assignees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_assignees ENABLE ROW LEVEL SECURITY;

-- Policies for lead_assignees
CREATE POLICY "Users can view assignees of their leads"
ON public.lead_assignees
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_assignees.lead_id AND leads.user_id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Users can assign leads they own"
ON public.lead_assignees
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_assignees.lead_id AND leads.user_id = auth.uid())
);

CREATE POLICY "Users can update assignees of their leads"
ON public.lead_assignees
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_assignees.lead_id AND leads.user_id = auth.uid())
);

CREATE POLICY "Users can delete assignees of their leads"
ON public.lead_assignees
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_assignees.lead_id AND leads.user_id = auth.uid())
);

-- Create index for performance
CREATE INDEX idx_lead_assignees_lead_id ON public.lead_assignees(lead_id);
CREATE INDEX idx_lead_assignees_user_id ON public.lead_assignees(user_id);