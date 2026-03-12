ALTER TABLE public.advisors
  ADD COLUMN IF NOT EXISTS sexual_orientation text,
  ADD COLUMN IF NOT EXISTS date_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS incall_rates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS outcall_rates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_slots text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.advisors
SET country = 'NL'
WHERE country IS DISTINCT FROM 'NL';

ALTER TABLE public.advisors
  ALTER COLUMN country SET DEFAULT 'NL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisors_sexual_orientation_check'
  ) THEN
    ALTER TABLE public.advisors
      ADD CONSTRAINT advisors_sexual_orientation_check
      CHECK (sexual_orientation IS NULL OR sexual_orientation IN ('Straight', 'Lesbian', 'Gay', 'Bisex'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'prevent_advisor_age_ethnicity_changes'
  ) THEN
    CREATE FUNCTION public.prevent_advisor_age_ethnicity_changes()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      IF OLD.age IS NOT NULL AND NEW.age IS DISTINCT FROM OLD.age THEN
        RAISE EXCEPTION 'advisors.age cannot be changed once set';
      END IF;

      IF OLD.ethnicity IS NOT NULL AND NEW.ethnicity IS DISTINCT FROM OLD.ethnicity THEN
        RAISE EXCEPTION 'advisors.ethnicity cannot be changed once set';
      END IF;

      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'advisors_lock_age_ethnicity'
  ) THEN
    CREATE TRIGGER advisors_lock_age_ethnicity
    BEFORE UPDATE ON public.advisors
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_advisor_age_ethnicity_changes();
  END IF;
END $$;
