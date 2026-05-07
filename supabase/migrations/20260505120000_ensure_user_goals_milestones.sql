-- Ensures milestones exist on user_goals (idempotent).
-- Needed when the dashboard project was provisioned before 20260208000000 ran, or milestones were omitted.
ALTER TABLE public.user_goals
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

UPDATE public.user_goals SET milestones = '[]'::jsonb WHERE milestones IS NULL;

COMMENT ON COLUMN public.user_goals.milestones IS 'User-defined milestones: [{ id, title, financialTarget, description, order }]';
