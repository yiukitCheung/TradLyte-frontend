import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { wisdomQuotes } from "@/data/wisdomQuotes";
import { getDailyQuote } from "@/lib/purposeUtils";

const WisdomQuote = () => {
  const quote = getDailyQuote(wisdomQuotes);

  return (
    <Card className="shadow-card border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground italic mb-1">
              "{quote.quote}"
            </p>
            <p className="text-xs text-muted-foreground">
              — {quote.author}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WisdomQuote;
