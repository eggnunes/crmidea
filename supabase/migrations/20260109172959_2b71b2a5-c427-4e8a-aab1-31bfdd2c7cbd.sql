-- Fix lead_tags RLS policies to verify lead ownership
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert lead tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Authenticated users can delete lead tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can view lead tags" ON public.lead_tags;

-- Create ownership-verified policies
-- Users can view tags for their own leads
CREATE POLICY "Users can view tags for their leads"
ON public.lead_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_tags.lead_id 
    AND leads.user_id = auth.uid()
  )
);

-- Users can insert tags for their own leads
CREATE POLICY "Users can insert tags for their leads"
ON public.lead_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_tags.lead_id 
    AND leads.user_id = auth.uid()
  )
);

-- Users can delete tags from their own leads
CREATE POLICY "Users can delete tags from their leads"
ON public.lead_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_tags.lead_id 
    AND leads.user_id = auth.uid()
  )
);