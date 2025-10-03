-- Add max backup size column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN max_backup_size_gb INTEGER NOT NULL DEFAULT 1;

-- Update default values for each plan
UPDATE public.subscriptions 
SET max_backup_size_gb = CASE 
  WHEN plan = 'free' THEN 1
  WHEN plan = 'pro' THEN 5
  WHEN plan = 'business' THEN 8
END;

-- Update the trigger function to set max_backup_size_gb on new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Create default subscription (free plan)
  INSERT INTO public.subscriptions (user_id, plan, max_backups, max_storage_gb, max_backup_size_gb, retention_days)
  VALUES (NEW.id, 'free', 3, 1, 1, 7);

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;