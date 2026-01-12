-- Add unique constraints for upsert operations
ALTER TABLE public.appstore_sales 
  ADD CONSTRAINT appstore_sales_unique_entry UNIQUE (date, product_name, country_code);

ALTER TABLE public.appstore_reviews 
  ADD CONSTRAINT appstore_reviews_apple_id_unique UNIQUE (apple_id);

ALTER TABLE public.appstore_metrics 
  ADD CONSTRAINT appstore_metrics_date_unique UNIQUE (date);