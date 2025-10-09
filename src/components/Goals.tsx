import { Target, Plus, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Goals = () => {
  const goals = [
    {
      title: "Build 6-Month Emergency Fund",
      progress: 85,
      status: "In Progress",
      deadline: "Dec 2025",
      category: "Security"
    },
    {
      title: "Start Investment Portfolio",
      progress: 100,
      status: "Completed",
      deadline: "Sep 2025",
      category: "Growth"
    },
    {
      title: "Reduce Credit Card Debt by 50%",
      progress: 43,
      status: "In Progress",
      deadline: "Mar 2026",
      category: "Freedom"
    },
    {
      title: "Learn About Index Funds",
      progress: 70,
      status: "In Progress",
      deadline: "Nov 2025",
      category: "Knowledge"
    },
  ];

  return (
    <section id="goals" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                Your Goals
              </h2>
              <p className="text-xl text-muted-foreground">
                Personal milestones on your financial journey
              </p>
            </div>
            <Button className="shadow-elegant">
              <Plus className="h-5 w-5 mr-2" />
              New Goal
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {goals.map((goal, index) => (
              <Card 
                key={goal.title}
                className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {goal.status === "Completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        ) : (
                          <Circle className="h-5 w-5 text-primary" />
                        )}
                        <span className="text-lg">{goal.title}</span>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Target: {goal.deadline}
                      </CardDescription>
                    </div>
                    <Badge variant={goal.status === "Completed" ? "default" : "secondary"}>
                      {goal.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{goal.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          goal.status === "Completed" 
                            ? "bg-gradient-accent" 
                            : "bg-gradient-primary"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Goals;
