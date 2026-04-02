-- Add new DNA columns to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS aesthetic TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS values JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS business_overview TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS layout_pattern TEXT;
