-- Fix: diagnostic completion trigger should never block client submission due to RLS on secondary tables.

CREATE OR REPLACE FUNCTION public.handle_diagnostic_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_consultant_id uuid;
  v_client_email text;
  v_consing_client_id uuid;
  v_badge_id uuid;
BEGIN
  -- Only act when diagnostic is completed (on INSERT or when it flips to true)
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.is_completed IS TRUE OR NEW.is_completed IS NOT TRUE) THEN
      RETURN NEW;
    END IF;
  ELSE
    IF (NEW.is_completed IS NOT TRUE) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT consultant_id, email
    INTO v_consultant_id, v_client_email
  FROM public.client_profiles
  WHERE user_id = NEW.client_user_id
  LIMIT 1;

  IF v_consultant_id IS NULL OR v_client_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve consulting client row (most recent by updated_at)
  SELECT id
    INTO v_consing_client_id
  FROM public.consulting_clients
  WHERE user_id = v_consultant_id
    AND lower(email) = lower(v_client_email)
  ORDER BY updated_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_consing_client_id IS NOT NULL THEN
    -- Update status to in_progress if still pending/null
    BEGIN
      UPDATE public.consulting_clients
      SET status = 'in_progress',
          updated_at = now()
      WHERE id = v_consing_client_id
        AND (status IS NULL OR status = 'pending');
    EXCEPTION WHEN OTHERS THEN
      -- Never block diagnostic completion.
      NULL;
    END;

    -- Award badge (diagnostic_complete) if not already earned
    BEGIN
      SELECT id
        INTO v_badge_id
      FROM public.client_badges
      WHERE requirement_type = 'diagnostic_complete'
      LIMIT 1;

      IF v_badge_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.client_earned_badges
          WHERE client_id = v_consing_client_id
            AND badge_id = v_badge_id
        ) THEN
          INSERT INTO public.client_earned_badges (client_id, badge_id)
          VALUES (v_consing_client_id, v_badge_id);
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If badges table is locked down or has unexpected RLS, ignore.
      NULL;
    END;
  END IF;

  -- Timeline event (avoid duplicates)
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM public.client_timeline_events
      WHERE client_user_id = NEW.client_user_id
        AND consultant_id = v_consultant_id
        AND event_type = 'form'
        AND title = 'Diagnóstico concluído'
    ) THEN
      INSERT INTO public.client_timeline_events (
        client_user_id,
        consultant_id,
        event_type,
        title,
        description,
        is_visible_to_client
      ) VALUES (
        NEW.client_user_id,
        v_consultant_id,
        'form',
        'Diagnóstico concluído',
        'Formulário de diagnóstico preenchido e enviado com sucesso.',
        true
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Never block diagnostic completion.
    NULL;
  END;

  RETURN NEW;
END;
$function$;

-- Lock down execute to backend roles; still runs via trigger.
REVOKE ALL ON FUNCTION public.handle_diagnostic_completed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_diagnostic_completed() TO postgres, service_role;