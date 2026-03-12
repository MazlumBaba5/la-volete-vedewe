-- Stripe billing support indexes
-- Apply this after the base schema to harden idempotency and billing reads.

CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_stripe_payment_intent_uidx
  ON public.credit_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_advisor_status_created_idx
  ON public.subscriptions (advisor_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_transactions_profile_created_idx
  ON public.credit_transactions (profile_id, created_at DESC);
