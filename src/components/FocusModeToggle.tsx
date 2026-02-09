import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useFocusMode } from '@/hooks/useFocusMode';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FocusModeToggle = () => {
  const { focusMode, toggleFocusMode } = useFocusMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFocusMode}
            className="gap-2"
          >
            {focusMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                Focus Mode ON
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Focus Mode OFF
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{focusMode ? 'Focus Mode hides charts and shows only essential metrics' : 'Enable Focus Mode to reduce noise'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FocusModeToggle;
