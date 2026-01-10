-- Make product column nullable for leads without a specific product
ALTER TABLE public.leads ALTER COLUMN product DROP NOT NULL;