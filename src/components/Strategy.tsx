import { Lightbulb, TrendingUp, Shield, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Strategy = () => {
  const strategies = [
    {
      icon: Shield,
      title: "Foundation Building",
      description: "Establish your financial security baseline",
      focus: "Emergency fund, debt management, basic savings",
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      title: "Growth Acceleration",
      description: "Scale your wealth with smart investments",
      focus: "Index funds, retirement accounts, diversification",
      color: "text-accent"
    },
    {
      icon: Rocket,
      title: "Advanced Strategies",
      description: "Optimize for long-term wealth building",
      focus: "Tax optimization, real estate, alternative assets",
      color: "text-primary"
    },
  ];

  return (
    <section id="strategy" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Lightbulb className="h-4 w-4" />
              <span>Your Strategic Path</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Build Your Strategy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A clear roadmap for your financial growth journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {strategies.map((strategy, index) => (
              <Card 
                key={strategy.title}
                className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50 group animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <strategy.icon className={`h-7 w-7 text-primary-foreground`} />
                  </div>
                  <CardTitle className="text-xl">{strategy.title}</CardTitle>
                  <CardDescription className="text-base">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Key Focus Areas:</div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {strategy.focus}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-card border-primary/20 bg-gradient-subtle">
            <CardHeader>
              <CardTitle className="text-2xl">Your Current Focus</CardTitle>
              <CardDescription className="text-base">
                Based on your progress and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg text-foreground">Foundation Building Phase</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You're currently building your financial foundation. Focus on completing your emergency fund 
                    and reducing debt before moving to advanced strategies. You're 68% through this phase.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Strategy;
