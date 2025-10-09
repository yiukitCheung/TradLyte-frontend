import { TrendingUp, Target, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const metrics = [
    {
      title: "Monthly Progress",
      value: "68%",
      change: "+12%",
      icon: TrendingUp,
      color: "text-accent"
    },
    {
      title: "Goals Completed",
      value: "7/10",
      change: "+2 this week",
      icon: Target,
      color: "text-primary"
    },
    {
      title: "Journal Entries",
      value: "24",
      change: "This month",
      icon: BookOpen,
      color: "text-accent"
    },
  ];

  return (
    <section id="dashboard" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Your Growth Dashboard
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your progress with clarity and focus
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <Card 
                key={metric.title}
                className="shadow-card hover:shadow-elegant transition-shadow duration-300 border-border/50 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Active Strategy Focus
              </CardTitle>
              <CardDescription>
                Your current financial growth areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Emergency Fund Building</span>
                  <span className="text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Investment Portfolio Growth</span>
                  <span className="text-muted-foreground">62%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Debt Reduction Strategy</span>
                  <span className="text-muted-foreground">43%</span>
                </div>
                <Progress value={43} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
