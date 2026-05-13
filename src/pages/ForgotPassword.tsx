import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const { error } = await sendPasswordReset(trimmed);
    setIsSubmitting(false);

    if (error) {
      // Surface only the generic outcome — never reveal whether the address
      // exists. Log details to console for the developer.
      console.warn('[forgot-password]', error.message);
    }

    setSubmitted(true);
    toast.success('If that email is registered, a reset link is on the way.');
  };

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
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your account email. If it&rsquo;s registered, we&rsquo;ll send you a secure link to choose a new password.
              </p>
            </div>

            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">
                  Check your inbox for a message from TradLyte. The link expires shortly for your security. If you don&rsquo;t see it within a minute, check the spam folder.
                </div>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  Send to a different email
                </Button>
                <Link to="/auth" className="block text-center text-sm text-primary hover:underline">
                  Return to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-foreground">Email</Label>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-background border-border focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base shadow-elegant hover:scale-[1.02] transition-transform"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending link…' : 'Send reset link'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Remembered it?{' '}
                  <Link to="/auth" className="text-primary hover:underline">
                    Sign in instead
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
