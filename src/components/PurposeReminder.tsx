import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserPurpose } from '@/lib/purposeUtils';

const PurposeReminder = () => {
  const purpose = getUserPurpose();

  if (!purpose) return null;

  return (
    <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Your Why</span>
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {purpose.primaryGoal}
            </p>
            {purpose.purposeStatement && (
              <p className="text-sm text-muted-foreground italic">
                "{purpose.purposeStatement}"
              </p>
            )}
          </div>
          <Link to="/goals">
            <Button variant="ghost" size="sm" className="gap-2">
              View Goals
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurposeReminder;
