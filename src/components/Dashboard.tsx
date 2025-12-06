import { TrendingUp, Target, BookOpen, Sparkles, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Lock, Zap, Calendar, Trophy, Brain, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const watchlistStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 178.52, change: 2.34, changePercent: 1.33, score: 87 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 485.09, change: 12.45, changePercent: 2.63, score: 92 },
    { symbol: "MSFT", name: "Microsoft", price: 378.91, change: -1.23, changePercent: -0.32, score: 85 },
    { symbol: "GOOGL", name: "Alphabet", price: 141.80, change: 3.21, changePercent: 2.32, score: 78 },
  ];

  const marketIndicators = [
    { name: "S&P 500", value: "4,567.23", change: "+1.2%", positive: true },
    { name: "VIX", value: "14.32", change: "-5.4%", positive: true },
    { name: "10Y Treasury", value: "4.21%", change: "+0.03", positive: false },
  ];

  const goals = [
    { title: "Emergency Fund", progress: 85, target: "$10,000", current: "$8,500" },
    { title: "Investment Portfolio", progress: 62, target: "$50,000", current: "$31,000" },
    { title: "Retirement Goal", progress: 28, target: "$500,000", current: "$140,000" },
  ];

  const journalStats = {
    totalEntries: 47,
    weekStreak: 12,
    avgMood: "Confident",
    topReflection: "Risk management improved trading consistency",
  };

  return (
    <section id="dashboard" className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <Badge variant="secondary" className="text-sm py-1.5 px-4">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Your Personal Command Center
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Wealth Dashboard Preview
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track your journey with clarity. All your insights, goals, and reflections in one place.
            </p>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid lg:grid-cols-4 gap-6 animate-slide-up">
            
            {/* Symbol Analytics - Main Section (3 cols) */}
            <Card className="lg:col-span-3 shadow-elegant border-border/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Symbol Analytics
                    </CardTitle>
                    <CardDescription>Your personalized watchlist with Tradlyte scores</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Zap className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Watchlist Table */}
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-3 bg-muted/30 text-sm font-medium text-muted-foreground">
                    <span>Symbol</span>
                    <span>Price</span>
                    <span>Change</span>
                    <span>Tradlyte Score</span>
                    <span className="text-right">Action</span>
                  </div>
                  {watchlistStocks.map((stock, index) => (
                    <div 
                      key={stock.symbol} 
                      className="grid grid-cols-5 gap-4 p-4 items-center border-t border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="font-mono font-medium">${stock.price.toFixed(2)}</div>
                      <div className={`flex items-center gap-1 ${stock.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {stock.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        <span className="font-medium">{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                            style={{ width: `${stock.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-primary">{stock.score}</span>
                      </div>
                      <div className="text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                          <LineChart className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-border/30 flex items-center justify-center overflow-hidden group/chart">
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                      <path 
                        d="M0,80 Q50,60 100,65 T200,45 T300,55 T400,30" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                      <path 
                        d="M0,85 Q50,75 100,78 T200,70 T300,72 T400,65" 
                        fill="none" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                    </svg>
                  </div>
                  <div className="text-center z-10">
                    <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Detailed charts available after sign in</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Indicators - Side Panel */}
            <div className="space-y-6">
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Market Pulse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {marketIndicators.map((indicator, index) => (
                    <div 
                      key={indicator.name} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="text-sm text-muted-foreground">{indicator.name}</div>
                        <div className="font-semibold font-mono">{indicator.value}</div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={indicator.positive ? 'bg-green-500/10 text-green-600 border-0' : 'bg-red-500/10 text-red-500 border-0'}
                      >
                        {indicator.change}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-card border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                      <PieChart className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold font-display text-foreground">+24.7%</div>
                    <p className="text-sm text-muted-foreground">Your YTD Performance</p>
                    <p className="text-xs text-primary font-medium">Beating S&P by 8.2%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Row - Goals & Journal */}
          <div className="grid md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            
            {/* Goals Progress */}
            <Card className="shadow-card border-border/50 group hover:shadow-elegant transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Goal Milestones
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    3 Active
                  </Badge>
                </div>
                <CardDescription>Track your financial journey progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {goals.map((goal, index) => (
                  <div key={goal.title} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{goal.title}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {goal.current} / {goal.target}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={goal.progress} className="h-2.5" />
                      <span className="absolute right-0 -top-6 text-xs font-semibold text-primary">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-transform"
                    onClick={() => navigate('/auth')}
                  >
                    View all goals
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Journal & Reflection */}
            <Card className="shadow-card border-border/50 group hover:shadow-elegant transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Journal & Reflection
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-accent/10 border-accent/30 text-accent">
                    <Calendar className="w-3 h-3 mr-1" />
                    {journalStats.weekStreak} week streak
                  </Badge>
                </div>
                <CardDescription>Your trading mindset & self-awareness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-2xl font-bold text-foreground">{journalStats.totalEntries}</div>
                    <div className="text-xs text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-2xl font-bold text-accent">{journalStats.avgMood}</div>
                    <div className="text-xs text-muted-foreground">Avg Mood</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Top Insight</p>
                      <p className="text-sm font-medium text-foreground italic">"{journalStats.topReflection}"</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-accent hover:text-accent hover:bg-accent/10 group-hover:translate-x-1 transition-transform"
                    onClick={() => navigate('/auth')}
                  >
                    Start journaling
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center pt-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant px-8"
              onClick={() => navigate('/auth')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Unlock Your Full Dashboard
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Free to get started • No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
