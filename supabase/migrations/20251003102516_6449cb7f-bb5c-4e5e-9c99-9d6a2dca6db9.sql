-- Update storage bucket file size limit to 8GB (for business plan max backup size)
UPDATE storage.buckets
SET file_size_limit = 8589934592  -- 8GB in bytes
WHERE id = 'backups';