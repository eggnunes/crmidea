-- Prevent duplicate consulting client records per consultant + email
-- We add a generated normalized email column and a unique constraint on (user_id, email_lc).

ALTER TABLE public.consulting_clients
ADD COLUMN IF NOT EXISTS email_lc text GENERATED ALWAYS AS (lower(email)) STORED;

-- Create unique index to enforce one record per consultant+email (case-insensitive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public'
      AND tablename='consulting_clients'
      AND indexname='consulting_clients_user_email_lc_key'
  ) THEN
    CREATE UNIQUE INDEX consulting_clients_user_email_lc_key
      ON public.consulting_clients (user_id, email_lc);
  END IF;
END$$;

-- Helpful lookup index for filtering by user and recent updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public'
      AND tablename='consulting_clients'
      AND indexname='consulting_clients_user_updated_idx'
  ) THEN
    CREATE INDEX consulting_clients_user_updated_idx
      ON public.consulting_clients (user_id, updated_at desc);
  END IF;
END$$;