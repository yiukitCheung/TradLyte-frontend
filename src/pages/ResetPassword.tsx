import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, ShieldCheck, TrendingUp, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { evaluatePassword, MIN_PASSWORD_LENGTH } from '@/lib/passwordPolicy';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const strengthMeta: Record<
  ReturnType<typeof evaluatePassword>['strengthLabel'],
  { label: string; tone: string; value: number }
> = {
  'very-weak': { label: 'Very weak', tone: 'text-rose-500', value: 10 },
  weak: { label: 'Weak', tone: 'text-rose-500', value: 30 },
  fair: { label: 'Fair', tone: 'text-amber-500', value: 55 },
  good: { label: 'Good', tone: 'text-emerald-500', value: 80 },
  strong: { label: 'Strong', tone: 'text-emerald-500', value: 100 },
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, user, loading, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const evaluation = useMemo(
    () =>
      evaluatePassword(password, {
        email: user?.email ?? null,
        fullName: (user?.user_metadata?.full_name as string | undefined) ?? null,
      }),
    [password, user?.email, user?.user_metadata],
  );

  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = evaluation.ok && passwordsMatch && !submitting;

  useEffect(() => {
    // If the user lands here without a recovery (or any) session, bounce them
    // to the forgot-password flow so the link can be re-issued.
    if (!loading && !session && !completed) {
      navigate('/forgot-password', { replace: true });
    }
  }, [loading, session, completed, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      toast.error(error.message || 'Could not update password.');
      return;
    }

    setCompleted(true);
    toast.success('Password updated. Please sign in with your new password.');
    await signOut();
    navigate('/auth', { replace: true });
  };

  const strength = strengthMeta[evaluation.strengthLabel];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle"></div>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      ></div>

      <div className="absolute top-8 left-8 z-20">
        <Link to="/auth">
          <Button variant="ghost" className="gap-2 hover:bg-card/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md space-y-8 animate-scale-in">
          <Link to="/" className="flex items-center justify-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-elegant">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-display font-bold text-foreground">TradLyte</span>
          </Link>

          <div className="rounded-3xl bg-card/90 backdrop-blur-xl border-2 border-border shadow-elegant p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Choose a new password</h1>
              <p className="text-sm text-muted-foreground">
                Use at least {MIN_PASSWORD_LENGTH} characters with a mix of letters, numbers, and a symbol.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground">New password</Label>
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background border-border focus:border-primary"
                />
                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Strength</span>
                      <span className={cn('font-medium', strength.tone)}>{strength.label}</span>
                    </div>
                    <Progress value={strength.value} className="h-1.5 rounded-full bg-muted" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={cn(
                    'h-12 bg-background border-border focus:border-primary',
                    confirm.length > 0 && !passwordsMatch && 'border-rose-500 focus:border-rose-500',
                  )}
                />
                {confirm.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-rose-500">Passwords do not match.</p>
                )}
              </div>

              <ul className="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-3">
                {evaluation.rules.map((rule) => (
                  <li
                    key={rule.id}
                    className={cn(
                      'flex items-center gap-2 text-xs',
                      rule.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                    )}
                  >
                    {rule.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    )}
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="submit"
                className="w-full h-12 text-base shadow-elegant hover:scale-[1.02] transition-transform"
                disabled={!canSubmit}
              >
                {submitting ? 'Updating…' : 'Update password'}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your new password is hashed and stored by Supabase Auth.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
