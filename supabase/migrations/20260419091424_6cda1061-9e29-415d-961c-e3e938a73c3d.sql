-- ============================================================
-- PIPELINE STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  win_probability integer NOT NULL DEFAULT 0 CHECK (win_probability BETWEEN 0 AND 100),
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pipeline_stages_user_sort_idx
  ON public.pipeline_stages (user_id, sort_order);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stages"
  ON public.pipeline_stages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own stages"
  ON public.pipeline_stages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stages"
  ON public.pipeline_stages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stages"
  ON public.pipeline_stages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  company text,
  email text,
  phone text,
  source text,
  status text NOT NULL DEFAULT 'active',
  converted_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_user_status_idx
  ON public.leads (user_id, status);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
  title text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  expected_close_date date,
  closed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_user_stage_idx ON public.deals (user_id, stage_id);
CREATE INDEX IF NOT EXISTS deals_user_close_idx ON public.deals (user_id, expected_close_date);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deals"
  ON public.deals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deals"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deals"
  ON public.deals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deals"
  ON public.deals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set closed_at when stage is won/lost; clear when reopened
CREATE OR REPLACE FUNCTION public.deals_handle_stage_close()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
BEGIN
  SELECT is_won, is_lost INTO s FROM public.pipeline_stages WHERE id = NEW.stage_id;
  IF (s.is_won OR s.is_lost) THEN
    IF NEW.closed_at IS NULL THEN
      NEW.closed_at = now();
    END IF;
  ELSE
    NEW.closed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deals_stage_close_trg
  BEFORE INSERT OR UPDATE OF stage_id ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_handle_stage_close();

-- ============================================================
-- DEAL ACTIVITY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deal_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_activity_deal_time_idx
  ON public.deal_activity (deal_id, created_at DESC);

ALTER TABLE public.deal_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deal activity"
  ON public.deal_activity FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deal activity"
  ON public.deal_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deal activity"
  ON public.deal_activity FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- SEED DEFAULT STAGES ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_pipeline_stages(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = _user_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.pipeline_stages (user_id, name, sort_order, win_probability, is_won, is_lost) VALUES
    (_user_id, 'New',       0, 10,  false, false),
    (_user_id, 'Qualified', 1, 30,  false, false),
    (_user_id, 'Proposal',  2, 60,  false, false),
    (_user_id, 'Won',       3, 100, true,  false),
    (_user_id, 'Lost',      4, 0,   false, true);
END;
$$;

-- Hook into existing handle_new_user flow by extending it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, auth_providers)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    ARRAY[COALESCE(NEW.raw_app_meta_data->>'provider', 'email')]
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    auth_providers = ARRAY(SELECT DISTINCT unnest(profiles.auth_providers || EXCLUDED.auth_providers)),
    updated_at = now();

  PERFORM public.seed_default_pipeline_stages(NEW.id);

  RETURN NEW;
END;
$$;

-- Backfill stages for any existing users that don't have any
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_default_pipeline_stages(u.id);
  END LOOP;
END $$;