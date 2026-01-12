-- Create table to store App Store webhook events
CREATE TABLE public.appstore_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  subtype TEXT,
  notification_uuid TEXT UNIQUE,
  transaction_id TEXT,
  original_transaction_id TEXT,
  product_id TEXT,
  bundle_id TEXT,
  environment TEXT,
  signed_date TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB,
  decoded_payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store subscription statuses
CREATE TABLE public.appstore_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_transaction_id TEXT UNIQUE NOT NULL,
  product_id TEXT,
  bundle_id TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  expires_date TIMESTAMP WITH TIME ZONE,
  purchase_date TIMESTAMP WITH TIME ZONE,
  renewal_info JSONB,
  last_transaction_id TEXT,
  environment TEXT,
  app_account_token TEXT,
  user_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appstore_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appstore_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only (using user_roles table)
CREATE POLICY "Admins can view webhook events"
ON public.appstore_webhook_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can view subscriptions"
ON public.appstore_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert subscriptions"
ON public.appstore_subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update subscriptions"
ON public.appstore_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create indexes for faster lookups
CREATE INDEX idx_webhook_events_transaction_id ON public.appstore_webhook_events(original_transaction_id);
CREATE INDEX idx_webhook_events_notification_type ON public.appstore_webhook_events(notification_type);
CREATE INDEX idx_webhook_events_created_at ON public.appstore_webhook_events(created_at DESC);
CREATE INDEX idx_subscriptions_email ON public.appstore_subscriptions(user_email);
CREATE INDEX idx_subscriptions_status ON public.appstore_subscriptions(status);

-- Create trigger for updated_at
CREATE TRIGGER update_appstore_subscriptions_updated_at
BEFORE UPDATE ON public.appstore_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();