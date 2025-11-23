-- Create user_api_keys table
CREATE TABLE public.user_api_keys (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_api_key TEXT,
  fal_key TEXT,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "user_api_keys_select_policy" ON public.user_api_keys 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_api_keys_insert_policy" ON public.user_api_keys 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_api_keys_update_policy" ON public.user_api_keys 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_api_keys_delete_policy" ON public.user_api_keys 
FOR DELETE TO authenticated USING (auth.uid() = user_id);