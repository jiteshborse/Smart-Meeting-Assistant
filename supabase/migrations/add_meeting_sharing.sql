-- Add visibility and sharing columns to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS visibility text 
  CHECK (visibility IN ('private', 'team', 'organization', 'public')) 
  DEFAULT 'private';

ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS shared_with jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Update RLS policies to support meeting sharing
-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can view their own meetings." ON meetings;

-- New policy: users can view meetings they own, or that are shared with them
CREATE POLICY "Users can view accessible meetings." ON meetings
  FOR SELECT USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (
      visibility = 'organization' 
      AND organization_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = meetings.organization_id 
        AND user_id = auth.uid()
      )
    )
    OR (
      shared_with IS NOT NULL 
      AND shared_with @> to_jsonb(auth.uid()::text)
    )
  );
