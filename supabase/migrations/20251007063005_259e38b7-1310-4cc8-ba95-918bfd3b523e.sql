-- Update insert_backup_log function to allow service role calls
CREATE OR REPLACE FUNCTION public.insert_backup_log(
  _user_id uuid,
  _action text,
  _status text,
  _message text DEFAULT NULL::text,
  _backup_id uuid DEFAULT NULL::uuid,
  _metadata jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _log_id uuid;
BEGIN
  -- Validate that authenticated user matches the user_id being logged
  -- Allow service role calls (when auth.uid() is NULL) to bypass this check
  -- This is needed for edge functions that use SERVICE_ROLE_KEY
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id THEN
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
$function$;