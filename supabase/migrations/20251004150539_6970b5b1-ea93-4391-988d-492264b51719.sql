-- Add explicit RLS policies to prevent privilege escalation on user_roles table

-- First, drop existing permissive policies if they allow unintended access
-- Keep the existing admin management policy and user view policy

-- Add explicit INSERT policy: Only admins can insert new roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add explicit UPDATE policy: Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add explicit DELETE policy: Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add audit logging for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  role app_role NOT NULL,
  changed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.role_audit_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, action, role, changed_by)
    VALUES (NEW.user_id, 'INSERT', NEW.role, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (user_id, action, role, changed_by)
    VALUES (NEW.user_id, 'UPDATE', NEW.role, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, action, role, changed_by)
    VALUES (OLD.user_id, 'DELETE', OLD.role, auth.uid());
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role audit logging
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON public.user_roles;
CREATE TRIGGER user_roles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();
