import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Target } from 'lucide-react';
import { getUserPurpose } from '@/lib/purposeUtils';

interface PurposeAlignmentCheckProps {
  stockSymbol: string;
  onComplete: (alignment: { aligned: string; reason: string }) => void;
  onSkip?: () => void;
}

const PurposeAlignmentCheck = ({ stockSymbol, onComplete, onSkip }: PurposeAlignmentCheckProps) => {
  const [aligned, setAligned] = useState('');
  const [reason, setReason] = useState('');
  const purpose = getUserPurpose();

  const handleSubmit = () => {
    if (!aligned) {
      return;
    }
    onComplete({ aligned, reason: reason.trim() });
  };

  return (
    <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Purpose Alignment Check
        </CardTitle>
        <CardDescription>
          Before adding {stockSymbol} to your portfolio, let's check if it aligns with your purpose
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {purpose && (
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Your Purpose:</p>
            <p className="text-sm font-medium text-foreground">{purpose.primaryGoal}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Does this align with your goals?</Label>
          <RadioGroup value={aligned} onValueChange={setAligned}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_sure" id="not_sure" />
              <Label htmlFor="not_sure" className="font-normal cursor-pointer">Not Sure</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="alignment-reason">How does this serve your 'why'? (optional)</Label>
          <Textarea
            id="alignment-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain how this stock aligns with your purpose..."
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {onSkip && (
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={!aligned} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurposeAlignmentCheck;
