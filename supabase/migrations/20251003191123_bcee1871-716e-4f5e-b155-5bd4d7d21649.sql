-- Add baserow_row_id column to backups table to map Supabase backups to Baserow rows
ALTER TABLE public.backups ADD COLUMN baserow_row_id INTEGER;