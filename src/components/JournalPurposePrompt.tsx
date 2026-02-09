import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Target } from 'lucide-react';
import { getUserPurpose } from '@/lib/purposeUtils';
import { getRegrets } from '@/lib/regretUtils';

interface JournalPurposePromptProps {
  onSelectPrompt: (prompt: string) => void;
}

const JournalPurposePrompt = ({ onSelectPrompt }: JournalPurposePromptProps) => {
  const purpose = getUserPurpose();
  const regrets = getRegrets();

  const purposePrompts = [
    "How did today's trades align with my 'why'?",
    "What would my future self say about this decision?",
    "Am I building wealth or chasing money?",
  ];

  const getPurposeSpecificPrompt = () => {
    if (!purpose) return null;
    
    const goal = purpose.primaryGoal.toLowerCase();
    if (goal.includes('family')) {
      return "How does today's trading move you closer to providing for your family?";
    }
    if (goal.includes('passion')) {
      return "How does today's trading support your ability to pursue your passion?";
    }
    if (goal.includes('cause') || goal.includes('support')) {
      return "How does today's trading help you support the causes you care about?";
    }
    if (goal.includes('generational') || goal.includes('wealth')) {
      return "How does today's trading contribute to building generational wealth?";
    }
    if (goal.includes('freedom') || goal.includes('independence')) {
      return "How does today's trading move you closer to financial independence?";
    }
    return "How does today's trading align with your purpose?";
  };

  const purposeSpecificPrompt = getPurposeSpecificPrompt();

  return (
    <Card className="shadow-card border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Purpose-Aligned Prompts</h3>
          </div>
          
          {purposeSpecificPrompt && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Based on your purpose:</p>
              <Button
                variant="outline"
                className="w-full text-left justify-start h-auto py-3"
                onClick={() => onSelectPrompt(purposeSpecificPrompt)}
              >
                <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">{purposeSpecificPrompt}</span>
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">General reflection prompts:</p>
            <div className="space-y-2">
              {purposePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-2 text-sm"
                  onClick={() => onSelectPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {regrets.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">Learn from past regrets:</p>
              <Button
                variant="outline"
                className="w-full text-left justify-start h-auto py-2 text-sm"
                onClick={() => onSelectPrompt(`Review my ${regrets.length} past regret${regrets.length > 1 ? 's' : ''} and reflect on what I've learned.`)}
              >
                <Target className="h-4 w-4 mr-2 text-accent" />
                Review Past Regrets ({regrets.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalPurposePrompt;
