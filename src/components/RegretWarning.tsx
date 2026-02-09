import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { type Regret } from '@/lib/regretUtils';
import { useState } from 'react';

interface RegretWarningProps {
  regret: Regret;
  onDismiss?: () => void;
  onReview?: () => void;
}

const RegretWarning = ({ regret, onDismiss, onReview }: RegretWarningProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Previous Regret Warning</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You previously regretted trading <strong>{regret.stockSymbol}</strong> on{' '}
          {new Date(regret.date).toLocaleDateString()}. Reason: <strong>{regret.reason}</strong>.
        </p>
        {regret.notes && (
          <p className="text-sm mb-2 italic">"{regret.notes}"</p>
        )}
        <div className="flex gap-2 mt-3">
          {onReview && (
            <Button size="sm" variant="outline" onClick={onReview}>
              Review Notes
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default RegretWarning;
