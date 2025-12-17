-- Create welcome_templates table for editable product messages
CREATE TABLE public.welcome_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_type text NOT NULL,
  message_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_type)
);

-- Enable RLS
ALTER TABLE public.welcome_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own templates"
ON public.welcome_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.welcome_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.welcome_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.welcome_templates FOR DELETE
USING (auth.uid() = user_id);

-- Add personal WhatsApp field to follow_up_settings
ALTER TABLE public.follow_up_settings 
ADD COLUMN personal_whatsapp text;

-- Trigger for updated_at
CREATE TRIGGER update_welcome_templates_updated_at
BEFORE UPDATE ON public.welcome_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();