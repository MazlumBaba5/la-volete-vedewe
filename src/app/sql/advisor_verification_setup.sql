ALTER TABLE public.advisors
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_note text;

UPDATE public.advisors
SET verification_status = CASE
  WHEN is_verified IS TRUE THEN 'approved'
  ELSE 'not_submitted'
END
WHERE verification_status IS NULL
   OR verification_status = ''
   OR (is_verified IS TRUE AND verification_status <> 'approved');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisors_verification_status_check'
  ) THEN
    ALTER TABLE public.advisors
      ADD CONSTRAINT advisors_verification_status_check
      CHECK (verification_status IN ('not_submitted', 'submitted', 'approved', 'rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.advisor_verification_uploads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  kind text NOT NULL,
  cloudinary_id text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_verification_uploads_kind_check'
  ) THEN
    ALTER TABLE public.advisor_verification_uploads
      ADD CONSTRAINT advisor_verification_uploads_kind_check
      CHECK (kind IN ('front_selfie', 'proof_selfie'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS advisor_verification_uploads_advisor_kind_idx
  ON public.advisor_verification_uploads (advisor_id, kind);
