ALTER TABLE public.advisors
  ADD COLUMN IF NOT EXISTS reviews_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS reviewer_username text;

UPDATE public.reviews
SET title = COALESCE(NULLIF(title, ''), 'Client review')
WHERE title IS NULL OR title = '';

UPDATE public.reviews
SET reviewer_username = COALESCE(NULLIF(reviewer_username, ''), 'guest')
WHERE reviewer_username IS NULL OR reviewer_username = '';

ALTER TABLE public.reviews
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN title SET DEFAULT 'Client review',
  ALTER COLUMN reviewer_username SET NOT NULL,
  ALTER COLUMN reviewer_username SET DEFAULT 'guest';

CREATE UNIQUE INDEX IF NOT EXISTS reviews_advisor_profile_unique_idx
  ON public.reviews (advisor_id, profile_id);

CREATE INDEX IF NOT EXISTS reviews_advisor_visible_created_idx
  ON public.reviews (advisor_id, is_visible, created_at DESC);
