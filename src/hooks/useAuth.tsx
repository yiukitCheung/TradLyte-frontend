import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { isOnboardingCompleteForUser } from '@/lib/purposeUtils';

const RESET_REDIRECT_PATH = '/reset-password';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);

        // When Supabase redirects back from a "Reset Password" email, this event
        // fires. The user is in a short-lived recovery session — route them to
        // the reset page so they can set a new password.
        if (event === 'PASSWORD_RECOVERY') {
          if (window.location.pathname !== RESET_REDIRECT_PATH) {
            navigate(RESET_REDIRECT_PATH, { replace: true });
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      if (isOnboardingCompleteForUser(data.user)) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
    return { error };
  };

  /**
   * Sends a password-reset email. We never reveal whether the address exists.
   * The link points back to `/reset-password` (must be on Supabase's redirect
   * URL allow-list in the dashboard).
   */
  const sendPasswordReset = async (email: string) => {
    const redirectTo = `${window.location.origin}${RESET_REDIRECT_PATH}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error };
  };

  /** Updates the password for the current (recovery) session. */
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
  };
};
