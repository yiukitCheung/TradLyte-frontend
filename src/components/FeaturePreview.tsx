import { Lock, Check, Target, TrendingUp, Calendar, Trophy, BookOpen, Smile, LineChart, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FeaturePreviewProps {
  title: string;
  description: string;
  features: string[];
  locked?: boolean;
}

const featureIcons: Record<string, React.ReactNode> = {
  "Custom Goal Creation": <Target className="h-5 w-5" />,
  "Progress Visualization": <TrendingUp className="h-5 w-5" />,
  "Deadline Management": <Calendar className="h-5 w-5" />,
  "Achievement Milestones": <Trophy className="h-5 w-5" />,
  "Daily Reflection Prompts": <BookOpen className="h-5 w-5" />,
  "Mood Tracking": <Smile className="h-5 w-5" />,
  "Financial Insights": <LineChart className="h-5 w-5" />,
  "Personal Growth Analytics": <Sparkles className="h-5 w-5" />,
};

const FeaturePreview = ({ title, description, features, locked = false }: FeaturePreviewProps) => {
  return (
    <div className="relative">
      {/* Header - Always visible */}
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((feature, index) => (
          <Card 
            key={index}
            className="p-6 border-border/50 bg-card/50 hover:bg-card/80 transition-colors group"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                {featureIcons[feature] || <Check className="h-5 w-5" />}
              </div>
              <div className="font-medium text-foreground">{feature}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lock CTA */}
      {locked && (
        <div className="flex justify-center">
          <Card className="p-6 shadow-elegant border-primary/20 max-w-lg text-center space-y-4 bg-gradient-to-br from-card to-muted/30">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground">Unlock {title}</h3>
                <p className="text-sm text-muted-foreground">
                  Free account required
                </p>
              </div>
            </div>
            <Link to="/auth">
              <Button size="lg" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FeaturePreview;
