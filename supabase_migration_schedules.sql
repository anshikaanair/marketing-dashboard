-- Add the missing schedules column to the campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '{}'::jsonb;
