import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MarketIndex from '@/components/MarketIndex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, Target, BookOpen, Sparkles, BarChart3, PieChart, 
  ArrowUpRight, ArrowDownRight, Zap, Calendar, Trophy, Brain, 
  LineChart, Search, Layers, ArrowRight 
} from "lucide-react";

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery("");
    }
  };

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
  ];

  const journalStats = {
    totalEntries: 47,
    weekStreak: 12,
    avgMood: "Confident",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Welcome Section */}
          <div className="max-w-6xl mx-auto text-center space-y-2">
            <Badge variant="secondary" className="text-sm py-1.5 px-4">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Welcome back, {user.user_metadata?.full_name || 'Trader'}!
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Your Wealth Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your journey with clarity and purpose
            </p>
          </div>

          {/* Main Dashboard Grid - Analytics + Growth Chart Side by Side */}
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
            
            {/* Left: Symbol Analytics */}
            <Card className="shadow-elegant border-border/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Symbol Analytics
                    </CardTitle>
                    <CardDescription>Your watchlist with Tradlyte scores</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Zap className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Watchlist Table - Compact */}
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 text-xs font-medium text-muted-foreground">
                    <span>Symbol</span>
                    <span>Price</span>
                    <span>Change</span>
                    <span>Score</span>
                  </div>
                  {watchlistStocks.map((stock) => (
                    <div 
                      key={stock.symbol} 
                      className="grid grid-cols-4 gap-2 p-3 items-center border-t border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <div>
                        <div className="font-semibold text-foreground text-sm">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                      </div>
                      <div className="font-mono text-sm">${stock.price.toFixed(2)}</div>
                      <div className={`flex items-center gap-1 text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {stock.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        <span>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            style={{ width: `${stock.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-primary">{stock.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Market Pulse - Inline */}
                <div className="grid grid-cols-3 gap-2">
                  {marketIndicators.map((indicator) => (
                    <div 
                      key={indicator.name} 
                      className="p-2 rounded-lg bg-muted/30 text-center"
                    >
                      <div className="text-xs text-muted-foreground">{indicator.name}</div>
                      <div className="font-semibold font-mono text-sm">{indicator.value}</div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${indicator.positive ? 'bg-green-500/10 text-green-600 border-0' : 'bg-red-500/10 text-red-500 border-0'}`}
                      >
                        {indicator.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right: Your Growth vs Market Chart */}
            <MarketIndex variant="user" />
          </div>

          {/* Stock Search Section */}
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-elegant border-border/50 overflow-hidden">
              <CardContent className="py-8">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      Discover & Analyze Stocks
                    </h2>
                    <p className="text-muted-foreground">
                      Search any symbol to get personalized recommendations based on your strategy
                    </p>
                  </div>
                  
                  <form onSubmit={handleSearch} className="relative">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Search any stock symbol (e.g., AAPL, TSLA, NVDA)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 md:h-16 pl-14 pr-32 text-lg bg-background border-2 border-border hover:border-primary/50 focus:border-primary rounded-2xl transition-all"
                      />
                      <Button
                        type="submit"
                        size="lg"
                        className="absolute right-2 top-1/2 -translate-y-1/2 shadow-elegant"
                      >
                        Analyze
                        <TrendingUp className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                  
                  {/* Quick tags */}
                  <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <span>Try:</span>
                    {["AAPL", "TSLA", "NVDA", "MSFT", "AMZN"].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => navigate(`/stock/${symbol}`)}
                        className="px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Overview */}
          <div className="max-w-6xl mx-auto">
            <MarketIndex />
          </div>

          {/* Quick Stats Row */}
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
            {/* Goals Quick View */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Goal Progress
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    2 Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.title} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{goal.title}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {goal.current} / {goal.target}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Journal Quick View */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Journal Insights
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-accent/10 border-accent/30 text-accent">
                    <Calendar className="w-3 h-3 mr-1" />
                    {journalStats.weekStreak} week streak
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-2xl font-bold text-foreground">{journalStats.totalEntries}</div>
                    <div className="text-xs text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-2xl font-bold text-accent">{journalStats.avgMood}</div>
                    <div className="text-xs text-muted-foreground">Avg Mood</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Navigation Buttons */}
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-elegant border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
              <CardContent className="py-10">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                      Continue Your Journey
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                      Build your strategy, reflect on your progress, and achieve your goals
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {/* Strategy Builder */}
                    <Link to="/strategy-builder" className="group">
                      <Card className="h-full border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-elegant bg-card">
                        <CardContent className="pt-6 text-center space-y-3">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Layers className="h-7 w-7 text-primary" />
                          </div>
                          <h3 className="font-display font-bold text-foreground">Strategy Builder</h3>
                          <p className="text-sm text-muted-foreground">
                            Design & test your investment strategies
                          </p>
                          <Button variant="ghost" size="sm" className="text-primary group-hover:translate-x-1 transition-transform">
                            Build Now
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>

                    {/* Goals */}
                    <Link to="/goals" className="group">
                      <Card className="h-full border-2 border-transparent hover:border-accent/50 transition-all duration-300 hover:shadow-elegant bg-card">
                        <CardContent className="pt-6 text-center space-y-3">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                            <Target className="h-7 w-7 text-accent" />
                          </div>
                          <h3 className="font-display font-bold text-foreground">Your Goals</h3>
                          <p className="text-sm text-muted-foreground">
                            Track financial milestones & progress
                          </p>
                          <Button variant="ghost" size="sm" className="text-accent group-hover:translate-x-1 transition-transform">
                            View Goals
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>

                    {/* Journal */}
                    <Link to="/journal" className="group">
                      <Card className="h-full border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-elegant bg-card">
                        <CardContent className="pt-6 text-center space-y-3">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Brain className="h-7 w-7 text-primary" />
                          </div>
                          <h3 className="font-display font-bold text-foreground">Reflection Journal</h3>
                          <p className="text-sm text-muted-foreground">
                            Capture insights & trading mindset
                          </p>
                          <Button variant="ghost" size="sm" className="text-primary group-hover:translate-x-1 transition-transform">
                            Start Writing
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;
