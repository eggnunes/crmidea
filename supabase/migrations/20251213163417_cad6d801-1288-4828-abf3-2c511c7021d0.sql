-- Create enum types for lead status and products
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_contato', 'qualificado', 'proposta_enviada', 'negociacao', 'fechado_ganho', 'fechado_perdido');

CREATE TYPE public.product_type AS ENUM ('consultoria', 'mentoria_coletiva', 'mentoria_individual', 'curso_idea', 'guia_ia', 'codigo_prompts', 'combo_ebooks');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  product product_type NOT NULL,
  status lead_status NOT NULL DEFAULT 'novo',
  value NUMERIC,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interactions table
CREATE TABLE public.interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for interactions (through lead ownership)
CREATE POLICY "Users can view interactions of their leads" ON public.interactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = interactions.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can create interactions for their leads" ON public.interactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = interactions.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can update interactions of their leads" ON public.interactions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = interactions.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can delete interactions of their leads" ON public.interactions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = interactions.lead_id AND leads.user_id = auth.uid())
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;
$$;

-- Trigger for automatic profile creation on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates on leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();