import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Target, ArrowRight, ArrowLeft, Heart, TrendingUp, Clock, DollarSign, Users } from 'lucide-react';
import { saveUserPurpose, type UserPurpose } from '@/lib/purposeUtils';
import { toast } from 'sonner';

const PURPOSE_OPTIONS = [
  { id: 'family', label: 'Financial freedom for family', icon: Heart },
  { id: 'passion', label: 'Pursue my passion full-time', icon: Sparkles },
  { id: 'causes', label: 'Support causes I care about', icon: Target },
  { id: 'generational', label: 'Create generational wealth', icon: Target },
  { id: 'freedom', label: 'Achieve financial independence', icon: Target },
  { id: 'other', label: 'Other', icon: Target },
];

const INVESTMENT_EXPERIENCE = [
  { id: 'beginner', label: 'Beginner - Just starting out', description: 'Learning the basics' },
  { id: 'intermediate', label: 'Intermediate - Some experience', description: 'Made a few investments' },
  { id: 'advanced', label: 'Advanced - Experienced investor', description: 'Regularly invest and trade' },
];

const TIME_HORIZON = [
  { id: 'short', label: '1-3 years', icon: Clock },
  { id: 'medium', label: '3-10 years', icon: TrendingUp },
  { id: 'long', label: '10+ years', icon: Target },
];

const PurposeOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [customGoal, setCustomGoal] = useState('');
  const [purposeStatement, setPurposeStatement] = useState('');
  const [investmentExperience, setInvestmentExperience] = useState<string>('');
  const [timeHorizon, setTimeHorizon] = useState<string>('');
  const [riskTolerance, setRiskTolerance] = useState<string>('');
  const [firstGoalTitle, setFirstGoalTitle] = useState('');
  const [firstGoalAmount, setFirstGoalAmount] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    if (goalId !== 'other') {
      setCustomGoal('');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedGoal || (selectedGoal === 'other' && !customGoal.trim())) {
        toast.error('Please select or enter what matters most to you');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!purposeStatement.trim()) {
        toast.error('Please share how wealth serves your purpose');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!investmentExperience) {
        toast.error('Please select your investment experience level');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!timeHorizon) {
        toast.error('Please select your time horizon');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (!riskTolerance) {
        toast.error('Please select your risk tolerance');
        return;
      }
      setStep(6);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const handleComplete = async () => {
    if (!firstGoalTitle.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    if (!user) {
      toast.error('Please sign in to continue');
      navigate('/auth');
      return;
    }

    const purpose: UserPurpose = {
      primaryGoal: selectedGoal === 'other' ? customGoal : PURPOSE_OPTIONS.find(o => o.id === selectedGoal)?.label || '',
      purposeStatement,
      onboardingComplete: true,
      supabaseUserId: user.id,
    };

    saveUserPurpose(purpose);

    setIsFinishing(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { onboarding_complete: true },
      });

      if (error) {
        toast.error(error.message || 'Could not save onboarding to your account. Please try again.');
        return;
      }

      toast.success('Welcome to TradLyte! Let\'s build wealth with purpose.');
      navigate('/dashboard');
    } finally {
      setIsFinishing(false);
    }
  };

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-3xl font-display font-bold text-foreground">TradLyte</span>
            </div>
            <CardTitle className="text-2xl">Discover Your Purpose</CardTitle>
            <CardDescription>
              Let's align your wealth-building journey with what truly matters to you
            </CardDescription>
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: What matters most */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label className="text-base font-semibold">What matters most to you?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose the primary reason you're building wealth
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PURPOSE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleGoalSelect(option.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedGoal === option.id
                            ? 'border-primary bg-primary/10 scale-105'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedGoal === 'other' && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="custom-goal">Tell us your purpose</Label>
                    <Input
                      id="custom-goal"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="What are you building wealth for?"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: How does wealth serve purpose */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label className="text-base font-semibold">How does wealth serve that purpose?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reflect on how building wealth connects to what matters most to you
                  </p>
                </div>
                <Textarea
                  value={purposeStatement}
                  onChange={(e) => setPurposeStatement(e.target.value)}
                  placeholder="For example: 'Wealth gives me the freedom to spend more time with my family and support their dreams without financial stress.'"
                  className="min-h-[120px]"
                />
              </div>
            )}

            {/* Step 3: Investment Experience */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label className="text-base font-semibold">What's your investment experience?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    This helps us personalize your experience
                  </p>
                </div>
                <div className="space-y-3">
                  {INVESTMENT_EXPERIENCE.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setInvestmentExperience(option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        investmentExperience === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">{option.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Time Horizon */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label className="text-base font-semibold">What's your investment time horizon?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    How long do you plan to invest before needing the money?
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_HORIZON.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setTimeHorizon(option.id)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          timeHorizon === option.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-sm font-medium text-foreground">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Risk Tolerance */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label className="text-base font-semibold">What's your risk tolerance?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    How comfortable are you with potential losses for higher returns?
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'conservative', label: 'Conservative', description: 'Prefer stability, lower returns' },
                    { id: 'moderate', label: 'Moderate', description: 'Balance of risk and return' },
                    { id: 'aggressive', label: 'Aggressive', description: 'Comfortable with higher risk for higher returns' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setRiskTolerance(option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        riskTolerance === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">{option.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: First Goal */}
            {step === 6 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label className="text-base font-semibold">Let's set your first goal</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a financial goal that aligns with your purpose
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    value={firstGoalTitle}
                    onChange={(e) => setFirstGoalTitle(e.target.value)}
                    placeholder="e.g., Emergency Fund, Dream Home, Retirement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-amount">Target Amount (optional)</Label>
                  <Input
                    id="goal-amount"
                    type="number"
                    value={firstGoalAmount}
                    onChange={(e) => setFirstGoalAmount(e.target.value)}
                    placeholder="e.g., 10000"
                  />
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Your Purpose:</strong> {selectedGoal === 'other' ? customGoal : PURPOSE_OPTIONS.find(o => o.id === selectedGoal)?.label}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              {step < totalSteps ? (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isFinishing} className="gap-2">
                  {isFinishing ? 'Saving…' : 'Complete Setup'}
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurposeOnboarding;
