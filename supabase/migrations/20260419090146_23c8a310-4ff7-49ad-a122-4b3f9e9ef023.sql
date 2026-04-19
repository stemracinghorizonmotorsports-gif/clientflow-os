-- Idempotency log for Stripe webhook events
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (which bypasses RLS) can access.
-- Explicitly deny for clarity.
CREATE POLICY "no client access to stripe_events"
ON public.stripe_events
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Per-user AI usage tracking for rate limiting
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_log_user_fn_time_idx
  ON public.ai_usage_log (user_id, function_name, created_at DESC);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no client access to ai_usage_log"
ON public.ai_usage_log
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);