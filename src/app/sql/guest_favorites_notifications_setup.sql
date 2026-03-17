-- Gold client favorites + notification events (new photos, online/offline)

-- 1) Ensure no duplicate favorites exist before creating a unique index.
WITH ranked_favorites AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY profile_id, advisor_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.favorites
)
DELETE FROM public.favorites f
USING ranked_favorites r
WHERE f.ctid = r.ctid
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_profile_advisor_unique_idx
  ON public.favorites (profile_id, advisor_id);

-- 2) Notifications table for guest favorite events.
CREATE TABLE IF NOT EXISTS public.guest_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('new_photo', 'online', 'offline')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_notifications_profile_created_idx
  ON public.guest_notifications (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS guest_notifications_profile_read_idx
  ON public.guest_notifications (profile_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS guest_notifications_advisor_created_idx
  ON public.guest_notifications (advisor_id, created_at DESC);

-- 3) Trigger: new public advisor photo -> notify all guests who favorited that advisor.
CREATE OR REPLACE FUNCTION public.notify_guest_favorites_new_photo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.media_type <> 'photo' THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.is_private, false) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.guest_notifications (profile_id, advisor_id, event_type, payload)
  SELECT
    f.profile_id,
    NEW.advisor_id,
    'new_photo',
    jsonb_build_object(
      'photo_url', NEW.url,
      'media_id', NEW.id,
      'created_at', NEW.created_at
    )
  FROM public.favorites f
  WHERE f.advisor_id = NEW.advisor_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS advisor_media_notify_guest_favorites_new_photo ON public.advisor_media;
CREATE TRIGGER advisor_media_notify_guest_favorites_new_photo
AFTER INSERT ON public.advisor_media
FOR EACH ROW
EXECUTE FUNCTION public.notify_guest_favorites_new_photo();

-- 4) Trigger: advisor availability transition offline <-> online -> notify favorites.
CREATE OR REPLACE FUNCTION public.notify_guest_favorites_availability_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  event_name text;
BEGIN
  IF NEW.availability IS NOT DISTINCT FROM OLD.availability THEN
    RETURN NEW;
  END IF;

  IF OLD.availability = 'offline' AND NEW.availability <> 'offline' THEN
    event_name := 'online';
  ELSIF OLD.availability <> 'offline' AND NEW.availability = 'offline' THEN
    event_name := 'offline';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.guest_notifications (profile_id, advisor_id, event_type, payload)
  SELECT
    f.profile_id,
    NEW.id,
    event_name,
    jsonb_build_object(
      'from', OLD.availability,
      'to', NEW.availability,
      'updated_at', NOW()
    )
  FROM public.favorites f
  WHERE f.advisor_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS advisors_notify_guest_favorites_availability_change ON public.advisors;
CREATE TRIGGER advisors_notify_guest_favorites_availability_change
AFTER UPDATE OF availability ON public.advisors
FOR EACH ROW
EXECUTE FUNCTION public.notify_guest_favorites_availability_change();
