CREATE TABLE IF NOT EXISTS public.client_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'gold',
  status text NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_memberships_plan_check'
  ) THEN
    ALTER TABLE public.client_memberships
      ADD CONSTRAINT client_memberships_plan_check
      CHECK (plan IN ('gold'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_memberships_status_check'
  ) THEN
    ALTER TABLE public.client_memberships
      ADD CONSTRAINT client_memberships_status_check
      CHECK (status IN ('active', 'canceled', 'expired', 'inactive'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_memberships_profile_status_created_idx
  ON public.client_memberships (profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS client_memberships_profile_period_end_idx
  ON public.client_memberships (profile_id, current_period_end DESC);
