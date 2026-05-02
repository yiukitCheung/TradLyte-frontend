import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, ArrowLeft, Sparkles, Target, BookOpen, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { isOnboardingCompleteForUser } from '@/lib/purposeUtils';

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (isOnboardingCompleteForUser(user)) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      navigate('/onboarding');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-subtle"></div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow"></div>
        <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: "1.5s" }}></div>
      </div>

      {/* Back to Home Button */}
      <div className="absolute top-8 left-8 z-20">
        <Link to="/">
          <Button variant="ghost" className="gap-2 hover:bg-card/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Branding & Messaging */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 py-20">
          <div className="max-w-xl space-y-8 animate-fade-in">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-elegant">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <span className="text-4xl font-display font-bold text-foreground">TradLyte</span>
            </Link>

            <div>
              <h1 className="text-5xl xl:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                Build Wealth
                <span className="block text-transparent bg-clip-text bg-gradient-primary mt-2">
                  With Purpose
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Stop chasing money. Start discovering meaning. Join thousands discovering purpose through strategic wealth building.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">No-Code Strategy Designer</h3>
                  <p className="text-sm text-muted-foreground">Build and test strategies without coding</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Life Alignment Engine</h3>
                  <p className="text-sm text-muted-foreground">Align wealth with your deeper purpose</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Bank-Level Security</h3>
                  <p className="text-sm text-muted-foreground">Your data is encrypted and protected</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent"
                  ></div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Sparkles key={star} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">10K+</span> investors finding their purpose
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex items-center justify-center px-4 py-20 lg:px-12">
          <div className="w-full max-w-md space-y-8 animate-scale-in">
            {/* Mobile Logo */}
            <Link to="/" className="flex lg:hidden items-center justify-center gap-3 group mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-elegant">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-display font-bold text-foreground">TradLyte</span>
            </Link>

            {/* Auth Card */}
            <div className="rounded-3xl bg-card/90 backdrop-blur-xl border-2 border-border shadow-elegant p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-display font-bold text-foreground">Welcome</h2>
                <p className="text-muted-foreground">Sign in or create an account to continue</p>
              </div>

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-card">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-card">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="h-12 bg-background border-border focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="h-12 bg-background border-border focus:border-primary"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base shadow-elegant hover:scale-[1.02] transition-transform" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-foreground">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="h-12 bg-background border-border focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="h-12 bg-background border-border focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="h-12 bg-background border-border focus:border-primary"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base shadow-elegant hover:scale-[1.02] transition-transform" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>

            {/* Trust Badge */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
