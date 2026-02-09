-- Add user-defined milestones to user_goals (JSONB array).
-- Each element: { "id": string, "title": string, "financialTarget": number, "description": string, "order": number }
ALTER TABLE public.user_goals
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]';

COMMENT ON COLUMN public.user_goals.milestones IS 'User-defined milestones: [{ id, title, financialTarget, description, order }]';
