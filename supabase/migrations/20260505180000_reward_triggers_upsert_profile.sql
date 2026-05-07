-- Rewards triggers: upsert behavior so journal/goal rows still award points if profiles row was never created.

CREATE OR REPLACE FUNCTION public.reward_award_journal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, reward_points, reward_level, updated_at)
  VALUES (
    NEW.user_id,
    25,
    public.compute_reward_level(25),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    reward_points = public.profiles.reward_points + 25,
    reward_level = public.compute_reward_level(public.profiles.reward_points + 25),
    updated_at = NOW();
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
  INSERT INTO public.profiles (id, reward_points, reward_level, updated_at)
  VALUES (
    NEW.user_id,
    50,
    public.compute_reward_level(50),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    reward_points = public.profiles.reward_points + 50,
    reward_level = public.compute_reward_level(public.profiles.reward_points + 50),
    updated_at = NOW();
  RETURN NEW;
END;
$$;
