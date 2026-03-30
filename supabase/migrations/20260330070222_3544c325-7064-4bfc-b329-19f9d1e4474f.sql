
-- 1. Fix: Remove public SELECT on client_portal_tokens, replace with secure lookup
DROP POLICY IF EXISTS "Anyone can read tokens for portal access" ON public.client_portal_tokens;

-- Create a security definer function for token lookup (no direct table access needed)
CREATE OR REPLACE FUNCTION public.lookup_portal_token(_token text)
RETURNS TABLE(client_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cpt.client_id
  FROM public.client_portal_tokens cpt
  WHERE cpt.token = _token
    AND (cpt.expires_at IS NULL OR cpt.expires_at > now())
  LIMIT 1;
$$;

-- 2. Fix: Remove unconditional anon SELECT on client_updates, add token-based access via function
DROP POLICY IF EXISTS "Anon can read updates for portal" ON public.client_updates;

-- Create security definer for portal data access
CREATE OR REPLACE FUNCTION public.get_portal_updates(_token text)
RETURNS TABLE(id uuid, title text, body text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cu.id, cu.title, cu.body, cu.created_at
  FROM public.client_updates cu
  INNER JOIN public.client_portal_tokens cpt ON cpt.client_id = cu.client_id
  WHERE cpt.token = _token
    AND (cpt.expires_at IS NULL OR cpt.expires_at > now())
  ORDER BY cu.created_at DESC;
$$;

-- Portal projects access
CREATE OR REPLACE FUNCTION public.get_portal_projects(_token text)
RETURNS TABLE(id uuid, name text, status text, progress int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.status, p.progress
  FROM public.projects p
  INNER JOIN public.client_portal_tokens cpt ON cpt.client_id = p.client_id
  WHERE cpt.token = _token
    AND (cpt.expires_at IS NULL OR cpt.expires_at > now());
$$;

-- Portal invoices access
CREATE OR REPLACE FUNCTION public.get_portal_invoices(_token text)
RETURNS TABLE(id uuid, invoice_number text, amount numeric, status text, due_date date, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.invoice_number, i.amount, i.status, i.due_date, i.created_at
  FROM public.invoices i
  INNER JOIN public.client_portal_tokens cpt ON cpt.client_id = i.client_id
  WHERE cpt.token = _token
    AND (cpt.expires_at IS NULL OR cpt.expires_at > now());
$$;

-- Portal client info
CREATE OR REPLACE FUNCTION public.get_portal_client(_token text)
RETURNS TABLE(id uuid, name text, company text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.company, c.status
  FROM public.clients c
  INNER JOIN public.client_portal_tokens cpt ON cpt.client_id = c.id
  WHERE cpt.token = _token
    AND (cpt.expires_at IS NULL OR cpt.expires_at > now())
  LIMIT 1;
$$;

-- 3. Fix: Add storage UPDATE policy for client-files bucket
CREATE POLICY "Users can update their client files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);
