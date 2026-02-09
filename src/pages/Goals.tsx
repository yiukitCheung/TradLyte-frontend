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

  const fetchGoals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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
      setLoading(false);
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

      toast.success('Goal created successfully!');
      setAddDialogOpen(false);
      setNewGoalTitle('');
      setNewGoalDescription('');
      setNewGoalAmount('');
      setNewGoalDate('');
      setNewMilestones([]);
      fetchGoals();
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
      fetchGoals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete goal');
    } finally {
      setDeleting(false);
    }
  };

  // Show loading while auth is loading or goals are loading
  if (authLoading || loading) {
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

  // If no user after loading, this will be handled by the useEffect redirect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 space-y-8 flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    Life Goals Journey
                  </h1>
                  <p className="text-muted-foreground">
                    Let Tradlyte guide you to discover and achieve your dreams through smart financial planning
                  </p>
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
                    className="shadow-elegant"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Goal
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
              <Card className="shadow-elegant max-w-2xl mx-auto w-full">
                <CardContent className="py-16 text-center">
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Goals Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Start your journey by creating your first financial goal and adding your own milestones.
                  </p>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      setAddDialogOpen(true);
                    }} 
                    className="shadow-elegant"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {goals.map((goal) => (
                <Card key={goal.id} className="shadow-elegant">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-display mb-2">{goal.title}</CardTitle>
                        {goal.description && (
                          <CardDescription className="text-base">{goal.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            Target: <span className="font-semibold text-foreground">${goal.target_amount ? parseFloat(goal.target_amount.toString()).toLocaleString() : '0'}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Current: <span className="font-semibold text-foreground">${goal.current_amount ? parseFloat(goal.current_amount.toString()).toLocaleString() : '0'}</span>
                          </span>
                          {goal.target_date && (
                            <span className="text-muted-foreground">
                              By: <span className="font-semibold text-foreground">{new Date(goal.target_date).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Badge variant="secondary">
                          {goal.progress.toFixed(0)}%
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setGoalToDelete(goal)}
                          aria-label="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Progress value={goal.progress} className="h-3" />
                    
                    {/* Milestones */}
                    {goal.milestones.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-foreground">Milestones</h4>
                        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                          {goal.milestones.map((milestone, index) => (
                            <div
                              key={milestone.id}
                              className={`relative pl-6 pb-4 ${
                                index === goal.milestones.length - 1 ? 'pb-0' : ''
                              }`}
                            >
                              <div className="absolute left-0 top-1 -translate-x-1/2">
                                {milestone.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-accent" />
                                ) : (
                                  <Circle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-medium text-sm ${
                                    milestone.completed 
                                      ? 'text-muted-foreground line-through' 
                                      : 'text-foreground'
                                  }`}>
                                    {milestone.title}
                                  </h4>
                                  {milestone.financialTarget > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      ${milestone.financialTarget.toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {milestone.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
