-- Add multi-instance support to backups table
ALTER TABLE public.backups 
ADD COLUMN instance_name TEXT,
ADD COLUMN instance_id TEXT;

-- Create index for faster filtering by instance
CREATE INDEX idx_backups_instance_id ON public.backups(instance_id);
CREATE INDEX idx_backups_user_instance ON public.backups(user_id, instance_id);

-- Add comment for documentation
COMMENT ON COLUMN public.backups.instance_name IS 'Human-readable name for the Home Assistant instance (e.g., "Casa Principal")';
COMMENT ON COLUMN public.backups.instance_id IS 'Unique identifier for the Home Assistant instance (e.g., "ha-casa-principal")';