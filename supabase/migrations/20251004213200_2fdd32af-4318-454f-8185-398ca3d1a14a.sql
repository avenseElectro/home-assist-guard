-- Add backup_trigger column to backups table
ALTER TABLE public.backups 
ADD COLUMN backup_trigger text DEFAULT 'manual' CHECK (backup_trigger IN ('manual', 'scheduled', 'pre_update', 'api'));

-- Add comment to explain the column
COMMENT ON COLUMN public.backups.backup_trigger IS 'Indicates what triggered the backup creation: manual, scheduled, pre_update, or api';