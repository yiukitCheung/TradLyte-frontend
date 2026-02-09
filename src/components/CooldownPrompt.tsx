import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface CooldownPromptProps {
  onEnable: () => void;
  onDismiss: () => void;
}

const CooldownPrompt = ({ onEnable, onDismiss }: CooldownPromptProps) => {
  return (
    <Alert className="mb-4 border-primary/20 bg-primary/5">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">Great Win!</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Consider taking a 24-hour break to reflect. This helps prevent emotional trading and overtrading.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onEnable}>
            Enable Cooldown Reminder
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CooldownPrompt;
