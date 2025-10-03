-- Update backups bucket to allow larger files (up to 10GB)
UPDATE storage.buckets 
SET file_size_limit = 10737418240
WHERE id = 'backups';