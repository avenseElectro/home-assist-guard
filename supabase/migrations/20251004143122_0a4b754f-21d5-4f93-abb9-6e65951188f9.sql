-- Drop the insecure policy that allows anyone to insert logs
DROP POLICY IF EXISTS "System can insert logs" ON public.backup_logs;

-- Create a secure function to insert backup logs
-- This uses SECURITY DEFINER to bypass RLS, but validates the caller
CREATE OR REPLACE FUNCTION public.insert_backup_log(
  _user_id uuid,
  _action text,
  _status text,
  _message text DEFAULT NULL,
  _backup_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  -- Validate that authenticated user matches the user_id being logged
  -- This prevents users from creating logs for other users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Cannot create logs for other users';
  END IF;
  
  -- Validate required fields
  IF _action IS NULL OR _action = '' THEN
    RAISE EXCEPTION 'Action is required';
  END IF;
  
  IF _status IS NULL OR _status = '' THEN
    RAISE EXCEPTION 'Status is required';
  END IF;
  
  -- Insert the log entry
  INSERT INTO public.backup_logs (
    user_id,
    action,
    status,
    message,
    backup_id,
    metadata
  )
  VALUES (
    _user_id,
    _action,
    _status,
    _message,
    _backup_id,
    _metadata
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_backup_log TO authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.insert_backup_log IS 
'Securely inserts backup logs. Validates that the caller can only create logs for their own user_id, preventing log forgery.';
