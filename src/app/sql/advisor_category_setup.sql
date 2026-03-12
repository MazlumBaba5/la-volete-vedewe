ALTER TABLE public.advisors
  ADD COLUMN IF NOT EXISTS advisor_category text;

UPDATE public.advisors
SET advisor_category = CASE
  WHEN advisor_category = 'women' THEN 'woman'
  WHEN advisor_category = 'men' THEN 'man'
  WHEN advisor_category = 'couples' THEN 'couple'
  WHEN advisor_category = 'shemales' THEN 'shemale'
  WHEN advisor_category = 'massage' THEN 'woman'
  WHEN advisor_category IS NOT NULL THEN advisor_category
  WHEN services_tags @> ARRAY['Couples']::text[] THEN 'couple'
  WHEN gender::text = 'male' THEN 'man'
  WHEN gender::text IN ('other', 'trans', 'shemale') THEN 'shemale'
  ELSE 'woman'
END
WHERE advisor_category IS NULL
   OR advisor_category IN ('women', 'men', 'couples', 'shemales', 'massage');

ALTER TABLE public.advisors
  ALTER COLUMN advisor_category SET DEFAULT 'woman';

UPDATE public.advisors
SET advisor_category = 'woman'
WHERE advisor_category NOT IN ('woman', 'man', 'couple', 'shemale');

ALTER TABLE public.advisors
  ALTER COLUMN advisor_category SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisors_advisor_category_check'
  ) THEN
    ALTER TABLE public.advisors
      ADD CONSTRAINT advisors_advisor_category_check
      CHECK (advisor_category IN ('woman', 'man', 'couple', 'shemale'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS advisors_category_status_idx
  ON public.advisors (advisor_category, status, created_at DESC);
