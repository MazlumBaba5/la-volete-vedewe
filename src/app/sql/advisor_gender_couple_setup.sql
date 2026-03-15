DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'gender_type'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'gender_type'
      AND e.enumlabel = 'couple'
  ) THEN
    ALTER TYPE public.gender_type ADD VALUE 'couple';
  END IF;
END $$;

UPDATE public.advisors
SET advisor_category = CASE
  WHEN gender::text = 'male' THEN 'man'
  WHEN gender::text = 'shemale' THEN 'shemale'
  WHEN gender::text = 'couple' THEN 'couple'
  ELSE 'woman'
END
WHERE advisor_category IS DISTINCT FROM CASE
  WHEN gender::text = 'male' THEN 'man'
  WHEN gender::text = 'shemale' THEN 'shemale'
  WHEN gender::text = 'couple' THEN 'couple'
  ELSE 'woman'
END;

