import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lightbulb, Sparkles, Target } from "lucide-react";
import { getUserPurpose } from "@/lib/purposeUtils";
import { getRegrets } from "@/lib/regretUtils";

interface JournalPurposePromptProps {
  onSelectPrompt: (promptText: string) => void;
  /** default: full Card; embedded: fits inside journal composer without double chrome */
  variant?: "default" | "embedded";
  className?: string;
}

const JournalPurposePrompt = ({
  onSelectPrompt,
  variant = "default",
  className,
}: JournalPurposePromptProps) => {
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
    if (goal.includes("family")) {
      return "How does today's trading move you closer to providing for your family?";
    }
    if (goal.includes("passion")) {
      return "How does today's trading support your ability to pursue your passion?";
    }
    if (goal.includes("cause") || goal.includes("support")) {
      return "How does today's trading help you support the causes you care about?";
    }
    if (goal.includes("generational") || goal.includes("wealth")) {
      return "How does today's trading contribute to building generational wealth?";
    }
    if (goal.includes("freedom") || goal.includes("independence")) {
      return "How does today's trading move you closer to financial independence?";
    }
    return "How does today's trading align with your purpose?";
  };

  const purposeSpecificPrompt = getPurposeSpecificPrompt();

  const inner = (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-foreground tracking-tight">
            Suggested reflections
          </h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Tap one to drop it into your thread
          </p>
        </div>
      </div>

      {purposeSpecificPrompt && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            From your purpose
          </p>
          <Button
            variant="ghost"
            className={cn(
              "w-full h-auto py-3 px-3.5 text-left justify-start items-start rounded-xl border border-primary/15 bg-primary/[0.04] hover:bg-primary/[0.09] hover:border-primary/25 text-foreground shadow-sm whitespace-normal break-words",
              variant === "embedded" && "rounded-2xl",
            )}
            onClick={() => onSelectPrompt(purposeSpecificPrompt)}
          >
            <Lightbulb className="h-4 w-4 mr-2.5 shrink-0 text-primary mt-0.5" />
            <span className="text-sm leading-snug font-normal text-left whitespace-normal break-words">
              {purposeSpecificPrompt}
            </span>
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          General prompts
        </p>
        <div className="flex flex-col gap-2">
          {purposePrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "w-full h-auto py-2.5 px-3 text-left justify-start items-start rounded-xl border border-border/50 bg-background/60 hover:bg-muted/80 text-sm font-normal text-foreground/95 whitespace-normal break-words",
                variant === "embedded" && "rounded-xl",
              )}
              onClick={() => onSelectPrompt(prompt)}
            >
              <span className="text-left whitespace-normal break-words leading-snug">{prompt}</span>
            </Button>
          ))}
        </div>
      </div>

      {regrets.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            Regret check-in
          </p>
          <Button
            variant="ghost"
            className="w-full h-auto py-2.5 px-3 text-left justify-start items-start rounded-xl border border-accent/20 bg-accent/[0.06] hover:bg-accent/10 text-sm font-normal whitespace-normal break-words"
            onClick={() =>
              onSelectPrompt(
                `Review my ${regrets.length} past regret${regrets.length > 1 ? "s" : ""} and reflect on what I've learned.`,
              )
            }
          >
            <Target className="h-4 w-4 mr-2 text-accent shrink-0" />
            <span className="text-left whitespace-normal break-words leading-snug">
              Review past regrets ({regrets.length})
            </span>
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === "embedded") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.05] via-card/80 to-accent/[0.04] p-[1px] shadow-sm",
          className,
        )}
      >
        <div className="rounded-2xl bg-card/95 backdrop-blur-[2px] px-4 py-4 min-w-0 overflow-hidden">{inner}</div>
      </div>
    );
  }

  return (
    <Card className={cn("shadow-elegant border-border/50 overflow-hidden", className)}>
      <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-accent/40 to-primary/30 opacity-90" />
      <CardContent className="pt-5 pb-5">{inner}</CardContent>
    </Card>
  );
};

export default JournalPurposePrompt;
