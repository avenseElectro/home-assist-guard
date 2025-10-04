-- Remove baserow_row_id column from backups table (no longer needed)
ALTER TABLE public.backups DROP COLUMN IF EXISTS baserow_row_id;