-- Rules for stripe_billing_setup.sql
-- Keep these invariants aligned with the application billing flow.

-- 1. stripe_payment_intent_id must stay unique when present.
--    Reason: webhook retries must never double-credit the same purchase.

-- 2. subscriptions queries must remain optimized by advisor_id + status.
--    Reason: the advisor dashboard and marketplace ranking read active plans often.

-- 3. credit transaction history must remain optimized by profile_id + created_at.
--    Reason: the dashboard loads the latest credit activity for the signed-in advisor.
