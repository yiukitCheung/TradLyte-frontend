import { BookOpen, Sparkles, Heart, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Journal = () => {
  const entries = [
    {
      date: "Oct 5, 2025",
      title: "Reflection on Emergency Fund Progress",
      excerpt: "Today I realized how much peace of mind comes from having savings. It's not just about the money—it's about freedom and security...",
      mood: "Grateful",
      icon: Heart
    },
    {
      date: "Oct 1, 2025",
      title: "Learning About Index Funds",
      excerpt: "Spent time understanding compound interest today. The math is simple, but the implications are profound for long-term wealth...",
      mood: "Curious",
      icon: Brain
    },
    {
      date: "Sep 28, 2025",
      title: "First Investment Milestone",
      excerpt: "Hit my first investment goal! Looking back at where I started, the journey has been about changing my mindset as much as my finances...",
      mood: "Proud",
      icon: Sparkles
    },
  ];

  return (
    <section id="journal" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                Your Journal
              </h2>
              <p className="text-xl text-muted-foreground">
                Reflect on your journey and insights
              </p>
            </div>
            <Button className="shadow-elegant">
              <BookOpen className="h-5 w-5 mr-2" />
              New Entry
            </Button>
          </div>

          <div className="space-y-6">
            {entries.map((entry, index) => (
              <Card 
                key={entry.date}
                className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <entry.icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{entry.title}</CardTitle>
                          <CardDescription>{entry.date}</CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                      {entry.mood}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {entry.excerpt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-card border-primary/20 bg-gradient-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Daily Reflection Prompt</h3>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  "What financial decision today aligned with my long-term values and goals?"
                </p>
                <Button variant="outline" className="mt-4">
                  Write About This
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Journal;
