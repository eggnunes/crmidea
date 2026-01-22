-- 1) When a client completes the diagnostic, automatically:
--   - move consulting_clients.status to in_progress
--   - add a timeline event (form)
--   - award the "Primeiro Passo" badge (diagnostic_complete)
--
-- NOTE: diagnostic_form_progress is keyed by client_user_id. We resolve consultant_id via client_profiles.

CREATE OR REPLACE FUNCTION public.handle_diagnostic_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_consultant_id uuid;
  v_client_email text;
  v_consulting_client_id uuid;
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
    INTO v_consulting_client_id
  FROM public.consulting_clients
  WHERE user_id = v_consultant_id
    AND lower(email) = lower(v_client_email)
  ORDER BY updated_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_consulting_client_id IS NOT NULL THEN
    -- Update status to in_progress if still pending/null
    UPDATE public.consulting_clients
    SET status = 'in_progress',
        updated_at = now()
    WHERE id = v_consulting_client_id
      AND (status IS NULL OR status = 'pending');

    -- Award badge (diagnostic_complete) if not already earned
    SELECT id
      INTO v_badge_id
    FROM public.client_badges
    WHERE requirement_type = 'diagnostic_complete'
    LIMIT 1;

    IF v_badge_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.client_earned_badges
        WHERE client_id = v_consulting_client_id
          AND badge_id = v_badge_id
      ) THEN
        INSERT INTO public.client_earned_badges (client_id, badge_id)
        VALUES (v_consulting_client_id, v_badge_id);
      END IF;
    END IF;
  END IF;

  -- Timeline event (avoid duplicates)
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_diagnostic_completed_ins ON public.diagnostic_form_progress;
CREATE TRIGGER trg_handle_diagnostic_completed_ins
AFTER INSERT ON public.diagnostic_form_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_diagnostic_completed();

DROP TRIGGER IF EXISTS trg_handle_diagnostic_completed_upd ON public.diagnostic_form_progress;
CREATE TRIGGER trg_handle_diagnostic_completed_upd
AFTER UPDATE OF is_completed ON public.diagnostic_form_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_diagnostic_completed();


-- 2) When a consulting session is created/updated, automatically add timeline events
CREATE OR REPLACE FUNCTION public.handle_consulting_session_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_client_email text;
  v_consultant_id uuid;
  v_client_user_id uuid;
  v_title text;
  v_type text;
BEGIN
  -- Resolve consulting client -> email + consultant
  SELECT email, user_id
    INTO v_client_email, v_consultant_id
  FROM public.consulting_clients
  WHERE id = NEW.client_id
  LIMIT 1;

  IF v_client_email IS NULL OR v_consultant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve client auth user id
  SELECT user_id
    INTO v_client_user_id
  FROM public.client_profiles
  WHERE consultant_id = v_consultant_id
    AND lower(email) = lower(v_client_email)
  LIMIT 1;

  IF v_client_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Decide event
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'scheduled' THEN
      v_type := 'meeting_scheduled';
      v_title := 'Reunião agendada';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    -- UPDATE
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
      v_type := 'meeting_completed';
      v_title := 'Reunião realizada';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Avoid duplicates
  IF NOT EXISTS (
    SELECT 1 FROM public.client_timeline_events
    WHERE client_user_id = v_client_user_id
      AND consultant_id = v_consultant_id
      AND event_type = v_type
      AND title = v_title
      AND event_date::date = now()::date
  ) THEN
    INSERT INTO public.client_timeline_events (
      client_user_id,
      consultant_id,
      event_type,
      title,
      description,
      is_visible_to_client
    ) VALUES (
      v_client_user_id,
      v_consultant_id,
      v_type,
      v_title,
      COALESCE(NEW.title, NULL),
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consulting_sessions_timeline_ins ON public.consulting_sessions;
CREATE TRIGGER trg_consulting_sessions_timeline_ins
AFTER INSERT ON public.consulting_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_consulting_session_timeline();

DROP TRIGGER IF EXISTS trg_consulting_sessions_timeline_upd ON public.consulting_sessions;
CREATE TRIGGER trg_consulting_sessions_timeline_upd
AFTER UPDATE OF status ON public.consulting_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_consulting_session_timeline();
