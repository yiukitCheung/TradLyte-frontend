-- TradLyte rewards: points + level on profiles (updated by triggers on journal / goals).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reward_points integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS reward_level integer DEFAULT 1 NOT NULL CHECK (reward_level >= 1);

COMMENT ON COLUMN public.profiles.reward_points IS 'Gamification points; incremented by triggers (journal entry, new goal)';
COMMENT ON COLUMN public.profiles.reward_level IS 'Derived tier from reward_points via compute_reward_level()';

CREATE OR REPLACE FUNCTION public.compute_reward_level(p integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p < 0 THEN 1
    WHEN p < 100 THEN 1
    WHEN p < 250 THEN 2
    WHEN p < 450 THEN 3
    WHEN p < 700 THEN 4
    WHEN p < 1000 THEN 5
    WHEN p < 1400 THEN 6
    WHEN p < 1900 THEN 7
    WHEN p < 2500 THEN 8
    WHEN p < 3200 THEN 9
    ELSE LEAST(20, 10 + (p - 3200) / 800 + 1)
  END::integer;
$$;

CREATE OR REPLACE FUNCTION public.reward_award_journal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    reward_points = COALESCE(public.profiles.reward_points, 0) + 25,
    reward_level = public.compute_reward_level(COALESCE(public.profiles.reward_points, 0) + 25),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reward_award_new_goal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    reward_points = COALESCE(public.profiles.reward_points, 0) + 50,
    reward_level = public.compute_reward_level(COALESCE(public.profiles.reward_points, 0) + 50),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reward_on_journal_insert ON public.journal_entries;
CREATE TRIGGER reward_on_journal_insert
  AFTER INSERT ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_award_journal();

DROP TRIGGER IF EXISTS reward_on_goal_insert ON public.user_goals;
CREATE TRIGGER reward_on_goal_insert
  AFTER INSERT ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_award_new_goal();
