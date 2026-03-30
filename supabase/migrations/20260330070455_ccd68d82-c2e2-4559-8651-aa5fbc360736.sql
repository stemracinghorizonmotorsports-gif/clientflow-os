
-- 1. Fix: Add UPDATE policies for client_updates and client_files
CREATE POLICY "Users can update their own updates"
  ON public.client_updates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their client files metadata"
  ON public.client_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Fix: Remove messages from realtime publication (RLS on the table restricts row access but not channel subscriptions)
ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
