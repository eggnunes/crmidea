-- Fix: implementation started trigger should never block step completion due to RLS on secondary tables.
-- Add SECURITY DEFINER and wrap badge/timeline operations in exception handlers.

CREATE OR REPLACE FUNCTION public.handle_implementation_started()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_completed_old boolean;
  v_has_completed_new boolean;
  v_badge_id uuid;
  v_client_user_id uuid;
BEGIN
  -- Only run when fragmented_prompts changes
  v_has_completed_old := COALESCE(
    jsonb_path_exists(OLD.fragmented_prompts, '$[*] ? (@.concluida == true)')
  , false);

  v_has_completed_new := COALESCE(
    jsonb_path_exists(NEW.fragmented_prompts, '$[*] ? (@.concluida == true)')
  , false);

  -- We only care about the first transition from "no completed steps" to "has at least one completed step"
  IF v_has_completed_old IS TRUE OR v_has_completed_new IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Award badge if available (non-blocking)
  BEGIN
    SELECT id
      INTO v_badge_id
    FROM public.client_badges
    WHERE requirement_type = 'implementation_started'
    LIMIT 1;

    IF v_badge_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.client_earned_badges
        WHERE client_id = NEW.id
          AND badge_id = v_badge_id
      ) THEN
        INSERT INTO public.client_earned_badges (client_id, badge_id)
        VALUES (NEW.id, v_badge_id);
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Never block step completion due to badge errors
    NULL;
  END;

  -- Resolve client_user_id
  SELECT user_id
    INTO v_client_user_id
  FROM public.client_profiles
  WHERE consultant_id = NEW.user_id
    AND lower(email) = lower(NEW.email)
  LIMIT 1;

  IF v_client_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Timeline event (non-blocking, avoid duplicates)
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM public.client_timeline_events
      WHERE client_user_id = v_client_user_id
        AND consultant_id = NEW.user_id
        AND event_type = 'implementation'
        AND title = 'Implementação iniciada'
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
        NEW.user_id,
        'implementation',
        'Implementação iniciada',
        'Primeiras etapas do plano de implementação foram iniciadas.',
        true
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Never block step completion due to timeline errors
    NULL;
  END;

  -- Make sure status is at least in_progress (non-blocking)
  BEGIN
    UPDATE public.consulting_clients
    SET status = 'in_progress', updated_at = now()
    WHERE id = NEW.id AND (status IS NULL OR status = 'pending');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- Lock down execute to backend roles; still runs via trigger.
REVOKE ALL ON FUNCTION public.handle_implementation_started() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_implementation_started() TO postgres, service_role;