-- Remove old policy with revoked_at filter
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;

-- Create new policy without revoked_at filter
-- This allows UPDATE to return the revoked row
-- Frontend filtering (revoked_at IS NULL) handles display
CREATE POLICY "Users can view their own API keys" 
ON api_keys 
FOR SELECT 
TO public
USING (auth.uid() = user_id);