-- Create table to store App Store sales data
CREATE TABLE public.appstore_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  units INTEGER DEFAULT 0,
  proceeds DECIMAL(10,2) DEFAULT 0,
  country_code VARCHAR(2),
  product_type VARCHAR(50), -- app, iap, subscription
  product_name TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table to store App Store reviews
CREATE TABLE public.appstore_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_id VARCHAR(100) UNIQUE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  author_name VARCHAR(255),
  country_code VARCHAR(2),
  review_date TIMESTAMPTZ,
  responded BOOLEAN DEFAULT false,
  response_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table to store App Store metrics/analytics
CREATE TABLE public.appstore_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  impressions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  redownloads INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  active_devices INTEGER DEFAULT 0,
  crashes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table to store sync history
CREATE TABLE public.appstore_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL, -- sales, reviews, metrics
  status VARCHAR(20) NOT NULL, -- success, error
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_appstore_sales_date ON public.appstore_sales(date);
CREATE INDEX idx_appstore_reviews_rating ON public.appstore_reviews(rating);
CREATE INDEX idx_appstore_reviews_date ON public.appstore_reviews(review_date);
CREATE INDEX idx_appstore_metrics_date ON public.appstore_metrics(date);

-- Enable RLS on all tables
ALTER TABLE public.appstore_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appstore_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appstore_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appstore_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Only admins can view appstore_sales"
  ON public.appstore_sales FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert appstore_sales"
  ON public.appstore_sales FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update appstore_sales"
  ON public.appstore_sales FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete appstore_sales"
  ON public.appstore_sales FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can view appstore_reviews"
  ON public.appstore_reviews FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert appstore_reviews"
  ON public.appstore_reviews FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update appstore_reviews"
  ON public.appstore_reviews FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete appstore_reviews"
  ON public.appstore_reviews FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can view appstore_metrics"
  ON public.appstore_metrics FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert appstore_metrics"
  ON public.appstore_metrics FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update appstore_metrics"
  ON public.appstore_metrics FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete appstore_metrics"
  ON public.appstore_metrics FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can view appstore_sync_logs"
  ON public.appstore_sync_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert appstore_sync_logs"
  ON public.appstore_sync_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Create trigger for updated_at on appstore_sales
CREATE TRIGGER update_appstore_sales_updated_at
  BEFORE UPDATE ON public.appstore_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on appstore_metrics
CREATE TRIGGER update_appstore_metrics_updated_at
  BEFORE UPDATE ON public.appstore_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();