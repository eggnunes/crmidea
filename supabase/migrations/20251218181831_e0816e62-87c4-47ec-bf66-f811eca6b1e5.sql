-- Create table for multiple products per lead
CREATE TABLE public.lead_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  product public.product_type NOT NULL,
  status public.lead_status NOT NULL DEFAULT 'novo',
  value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_products ENABLE ROW LEVEL SECURITY;

-- Create policies - users can only access their own lead products
CREATE POLICY "Users can view their own lead products" 
ON public.lead_products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_products.lead_id 
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own lead products" 
ON public.lead_products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_products.lead_id 
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own lead products" 
ON public.lead_products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_products.lead_id 
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own lead products" 
ON public.lead_products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_products.lead_id 
    AND leads.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_products_updated_at
BEFORE UPDATE ON public.lead_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing lead products to the new table
INSERT INTO public.lead_products (lead_id, product, status, value, created_at)
SELECT id, product, status, value, created_at
FROM public.leads;