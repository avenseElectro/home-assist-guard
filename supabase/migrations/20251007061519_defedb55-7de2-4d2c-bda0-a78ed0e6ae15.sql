-- Drop the existing UPDATE policy that's causing RLS violations
DROP POLICY IF EXISTS "Users can revoke their own API keys" ON api_keys;

-- Recreate the policy with explicit WITH CHECK clause
CREATE POLICY "Users can revoke their own API keys"
ON api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);