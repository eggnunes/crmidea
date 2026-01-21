-- Increase country_code column size in appstore_reviews and appstore_sales
ALTER TABLE public.appstore_reviews 
ALTER COLUMN country_code TYPE character varying(10);

ALTER TABLE public.appstore_sales 
ALTER COLUMN country_code TYPE character varying(10);