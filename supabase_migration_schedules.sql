-- Add schedules column to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '{}'::jsonb;
