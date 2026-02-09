import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';
import { addRegret, type Regret } from '@/lib/regretUtils';
import { toast } from 'sonner';

interface RegretSystemProps {
  stockSymbol: string;
  industry?: string;
  onRegretAdded?: () => void;
}

const REGRET_REASONS = [
  { value: 'exited_early', label: 'Exited too early' },
  { value: 'not_aligned', label: "Didn't align with goals" },
  { value: 'emotional', label: 'Emotional decision' },
  { value: 'other', label: 'Other' },
];

const RegretSystem = ({ stockSymbol, industry, onRegretAdded }: RegretSystemProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Please select a reason for this regret');
      return;
    }

    const regret: Regret = {
      stockSymbol,
      date: new Date().toISOString(),
      reason: REGRET_REASONS.find(r => r.value === reason)?.label || reason,
      notes: notes.trim() || undefined,
      industry: industry || undefined,
    };

    addRegret(regret);
    toast.success('Regret logged. We\'ll remind you if you consider similar trades.');
    setOpen(false);
    setReason('');
    setNotes('');
    onRegretAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Mark as Regret
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {stockSymbol} as Regret</DialogTitle>
          <DialogDescription>
            Help us learn from this experience. We'll warn you if you consider similar trades in the future.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Why did you regret this trade?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REGRET_REASONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="regret-notes">Additional notes (optional)</Label>
            <Textarea
              id="regret-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn from this experience?"
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="destructive">
            Mark as Regret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegretSystem;
