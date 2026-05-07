import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, Circle, Plus, X, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type Milestone } from '@/lib/goalUtils';
import { POINTS_PER_NEW_GOAL } from "@/lib/rewards";
import { cn } from "@/lib/utils";

/** Stored in DB: no "completed" (computed from current_amount when displaying) */
interface StoredMilestone {
  id: string;
  title: string;
  financialTarget: number;
  description: string;
  order: number;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number | null;
  current_amount: number | null;
  target_date: string | null;
  status: string | null;
  milestones: Milestone[];
  progress: number;
}

const Goals = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newMilestones, setNewMilestones] = useState<{ id: string; title: string; financialTarget: string; description: string }[]>([]);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rewardProfile, setRewardProfile] = useState<{ points: number; level: number } | null>(
    null
  );

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return;
    }
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchGoals();
  }, [user, authLoading, navigate]);

  const GOAL_COLUMNS =
    'id,user_id,title,description,target_amount,current_amount,target_date,status,milestones,created_at,updated_at' as const;

  const fetchGoals = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!user) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    try {
      const [goalsResult, profileResult] = await Promise.all([
        supabase
          .from('user_goals')
          .select(GOAL_COLUMNS)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('reward_points, reward_level')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      const error = goalsResult.error;
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (profileResult.error) {
        console.warn("Goals: could not load reward profile", profileResult.error.message);
      } else if (profileResult.data) {
        setRewardProfile({
          points: Number(profileResult.data.reward_points ?? 0),
          level: Number(profileResult.data.reward_level ?? 1),
        });
      }

      const data = goalsResult.data;
      const goalsWithMilestones = (data || []).map(goal => {
        try {
          const targetAmount = goal.target_amount ? parseFloat(goal.target_amount.toString()) : 0;
          const currentAmount = goal.current_amount ? parseFloat(goal.current_amount.toString()) : 0;
          const stored = (goal as { milestones?: StoredMilestone[] }).milestones;
          const rawMilestones = Array.isArray(stored) && stored.length > 0 ? stored : [];
          const milestones: Milestone[] = rawMilestones
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(m => ({
              id: m.id,
              title: m.title,
              financialTarget: m.financialTarget ?? 0,
              description: m.description ?? '',
              order: m.order ?? 0,
              completed: currentAmount >= (m.financialTarget ?? 0)
            }));

          const progress = targetAmount > 0
            ? Math.min(100, (currentAmount / targetAmount) * 100)
            : 0;

          return {
            ...goal,
            milestones,
            progress
          };
        } catch (err) {
          console.error('Error processing goal:', err, goal);
          return {
            ...goal,
            milestones: [],
            progress: 0
          };
        }
      });

      setGoals(goalsWithMilestones);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      toast.error(error.message || 'Failed to load goals. Please refresh the page.');
      setGoals([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!user) return;
    if (!newGoalTitle.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    if (!newGoalAmount || parseFloat(newGoalAmount) <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    try {
      const milestonesToStore: StoredMilestone[] = newMilestones
        .filter(m => m.title.trim() !== '')
        .map((m, i) => ({
          id: m.id || `m-${Date.now()}-${i}`,
          title: m.title.trim(),
          financialTarget: parseFloat(m.financialTarget) || 0,
          description: m.description.trim() || '',
          order: i + 1
        }));

      const { error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          title: newGoalTitle,
          description: newGoalDescription.trim() || null,
          target_amount: parseFloat(newGoalAmount),
          current_amount: 0,
          target_date: newGoalDate || null,
          status: 'active',
          milestones: milestonesToStore
        });

      if (error) throw error;

      toast.success(`Goal created! +${POINTS_PER_NEW_GOAL} Tradlyte reward points earned.`);
      setAddDialogOpen(false);
      setNewGoalTitle('');
      setNewGoalDescription('');
      setNewGoalAmount('');
      setNewGoalDate('');
      setNewMilestones([]);
      fetchGoals({ silent: true });
    } catch (error: any) {
      console.error('Error adding goal:', error);
      toast.error(error.message || 'Failed to create goal');
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete || !user) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalToDelete.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Goal deleted');
      setGoalToDelete(null);
      fetchGoals({ silent: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete goal');
    } finally {
      setDeleting(false);
    }
  };

  // Blocking spinner only until auth settles and the first goals fetch completes
  const showGoalsSkeleton = loading && goals.length === 0;
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-2xl font-semibold mb-2">Loading your goals...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (showGoalsSkeleton) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative isolate">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute top-[-6rem] left-[-4rem] h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
        </div>
        <Header />
        <main className="relative z-10 flex-1 py-8">
          <div className="container mx-auto px-4 space-y-6 max-w-6xl">
            <div className="h-14 w-72 rounded-stadium bg-muted/50 animate-pulse" />
            <div className="h-52 rounded-stadium border border-border/40 bg-muted/25 animate-pulse shadow-card" />
            <div className="h-52 rounded-stadium border border-border/40 bg-muted/25 animate-pulse shadow-card" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative isolate">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-20 right-[-5%] h-[340px] w-[340px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute top-[46%] left-[-12%] h-[280px] w-[280px] rounded-full bg-accent/[0.05] blur-3xl" />
      </div>
      <Header />
      <main className="relative z-10 flex-1 py-8">
        <div className="container mx-auto px-4 space-y-8 flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary shadow-sm ring-1 ring-primary/10">
                  <Target className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">Life planning</p>
                  <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-foreground">
                    Your goals
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    Set targets, milestones, and track progress alongside Tradlyte rewards.
                  </p>
                  {rewardProfile != null ? (
                    <div className="inline-flex flex-wrap items-center gap-2 pt-2">
                      <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.05] px-3 py-1.5 text-xs font-medium">
                        <span className="text-muted-foreground">Level</span>
                        <span className="tabular-nums text-foreground">{rewardProfile.level}</span>
                        <span className="mx-1 h-3 w-px bg-border shrink-0" aria-hidden />
                        <span className="tabular-nums text-primary">{rewardProfile.points}</span>
                        <span className="text-muted-foreground">pts</span>
                      </span>
                      <Badge variant="outline" className="rounded-lg border-accent/25 text-accent-foreground/90 bg-accent/[0.06] font-normal">
                        New goal +{POINTS_PER_NEW_GOAL}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) {
                  setNewGoalTitle('');
                  setNewGoalDescription('');
                  setNewGoalAmount('');
                  setNewGoalDate('');
                  setNewMilestones([]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-xl px-6 h-11 shadow-elegant gap-2 font-semibold shrink-0"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    New goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                    <DialogDescription>
                      Set your goal and add your own milestones to track progress
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal-title">Goal Title *</Label>
                      <Input
                        id="goal-title"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="e.g., Buy Dream Home, Emergency Fund, Retirement"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-description">Description (optional)</Label>
                      <Textarea
                        id="goal-description"
                        value={newGoalDescription}
                        onChange={(e) => setNewGoalDescription(e.target.value)}
                        placeholder="Why is this goal important to you?"
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-amount">Target Amount ($) *</Label>
                      <Input
                        id="goal-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newGoalAmount}
                        onChange={(e) => setNewGoalAmount(e.target.value)}
                        placeholder="e.g., 50000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-date">Target Date (optional)</Label>
                      <Input
                        id="goal-date"
                        type="date"
                        value={newGoalDate}
                        onChange={(e) => setNewGoalDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <Label>Milestones (optional)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewMilestones(prev => [...prev, { id: `m-${Date.now()}`, title: '', financialTarget: '', description: '' }])}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add milestone
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add steps you want to hit (e.g. first $5k saved, 25% of goal). Order is preserved.
                      </p>
                      <div className="space-y-3">
                        {newMilestones.map((milestone, index) => (
                          <div key={milestone.id} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Milestone {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setNewMilestones(prev => prev.filter(m => m.id !== milestone.id))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              value={milestone.title}
                              onChange={(e) => setNewMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, title: e.target.value } : m))}
                              placeholder="e.g. First $5,000 saved"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={milestone.financialTarget}
                                onChange={(e) => setNewMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, financialTarget: e.target.value } : m))}
                                placeholder="Amount ($)"
                              />
                              <Input
                                value={milestone.description}
                                onChange={(e) => setNewMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, description: e.target.value } : m))}
                                placeholder="Short description"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAddDialogOpen(false);
                        setNewGoalTitle('');
                        setNewGoalDescription('');
                        setNewGoalAmount('');
                        setNewGoalDate('');
                        setNewMilestones([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddGoal}
                      disabled={!newGoalTitle.trim() || !newGoalAmount || parseFloat(newGoalAmount) <= 0}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[320px]">
              <Card className="max-w-xl mx-auto w-full rounded-stadium border-border/40 shadow-elegant overflow-hidden ring-1 ring-black/[0.03]">
                <div className="h-1 bg-gradient-to-r from-primary/60 via-accent/50 to-primary/40" />
                <CardContent className="py-14 sm:py-16 text-center px-6">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/12 to-accent/10 text-primary ring-1 ring-primary/10">
                    <Target className="h-8 w-8" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">Start with one goal</h3>
                  <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                    Name it, set a target, and add milestones so progress feels tangible.
                  </p>
                  <Button
                    size="lg"
                    className="rounded-xl shadow-elegant px-8 h-11 font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      setAddDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
                    Create first goal
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {goals.map((goal) => (
                <Card
                  key={goal.id}
                  className="rounded-stadium border-border/40 shadow-card hover:shadow-elegant transition-shadow duration-300 overflow-hidden bg-card/90 backdrop-blur-[1px] ring-1 ring-black/[0.02] dark:ring-white/[0.04]"
                >
                  <CardHeader className="border-b border-border/35 bg-gradient-to-r from-primary/[0.04] via-card to-accent/[0.03] px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-display font-semibold tracking-tight mb-1.5">
                          {goal.title}
                        </CardTitle>
                        {goal.description ? (
                          <CardDescription className="text-[15px] leading-relaxed text-muted-foreground">
                            {goal.description}
                          </CardDescription>
                        ) : null}
                        <div className="flex items-center gap-3 mt-4 text-sm flex-wrap">
                          <span className="inline-flex items-baseline gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-muted-foreground">
                            <span className="text-[11px] uppercase tracking-wide">Target</span>
                            <span className="font-semibold tabular-nums text-foreground">
                              $
                              {goal.target_amount ? parseFloat(goal.target_amount.toString()).toLocaleString() : "0"}
                            </span>
                          </span>
                          <span className="inline-flex items-baseline gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-muted-foreground">
                            <span className="text-[11px] uppercase tracking-wide">Now</span>
                            <span className="font-semibold tabular-nums text-foreground">
                              $
                              {goal.current_amount ? parseFloat(goal.current_amount.toString()).toLocaleString() : "0"}
                            </span>
                          </span>
                          {goal.target_date ? (
                            <span className="text-xs text-muted-foreground">
                              By{" "}
                              <span className="font-medium text-foreground">
                                {new Date(goal.target_date).toLocaleDateString()}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className="rounded-lg border-0 bg-primary/12 text-primary font-mono text-xs px-2.5 py-1">
                          {goal.progress.toFixed(0)}%
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setGoalToDelete(goal)}
                          aria-label="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 px-6 py-6">
                    <Progress value={goal.progress} className="h-2 rounded-full bg-muted" />
                    {goal.milestones.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Milestones
                        </h4>
                        <div className="relative pl-6 space-y-0 border-l border-primary/25">
                          {goal.milestones.map((milestone, index) => (
                            <div
                              key={milestone.id}
                              className={cn(
                                "relative pb-5 pl-6",
                                index === goal.milestones.length - 1 ? "pb-0" : "",
                              )}
                            >
                              <div className="absolute -left-[25px] top-1.5 flex h-7 w-7 items-center justify-center rounded-xl border border-background bg-card shadow-sm">
                                {milestone.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-primary/80 shrink-0" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      "font-medium text-sm",
                                      milestone.completed
                                        ? "text-muted-foreground line-through decoration-border"
                                        : "text-foreground",
                                    )}
                                  >
                                    {milestone.title}
                                  </span>
                                  {milestone.financialTarget > 0 ? (
                                    <Badge variant="outline" className="text-[11px] rounded-md px-2 font-normal border-border/60">
                                      ${milestone.financialTarget.toLocaleString()}
                                    </Badge>
                                  ) : null}
                                </div>
                                {milestone.description ? (
                                  <p className="text-xs text-muted-foreground leading-relaxed">{milestone.description}</p>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{goalToDelete?.title}&quot; and its milestones. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Goals;
