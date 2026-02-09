import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { wisdomQuotes } from "@/data/wisdomQuotes";
import { getDailyQuote } from "@/lib/purposeUtils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const WisdomQuoteBanner = () => {
  const [currentQuote, setCurrentQuote] = useState(getDailyQuote(wisdomQuotes));
  const [quoteIndex, setQuoteIndex] = useState(0);

  const handleNext = () => {
    const nextIndex = (quoteIndex + 1) % wisdomQuotes.length;
    setQuoteIndex(nextIndex);
    setCurrentQuote(wisdomQuotes[nextIndex]);
  };

  const handlePrev = () => {
    const prevIndex = quoteIndex === 0 ? wisdomQuotes.length - 1 : quoteIndex - 1;
    setQuoteIndex(prevIndex);
    setCurrentQuote(wisdomQuotes[prevIndex]);
  };

  return (
    <Card className="shadow-elegant border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 mb-6">
      <CardContent className="py-4 px-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1 text-center">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground italic">
                "{currentQuote.quote}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                — {currentQuote.author}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WisdomQuoteBanner;
