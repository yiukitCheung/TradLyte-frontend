import { ArrowRight, Sparkles, Search, TrendingUp, Target, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery("");
    }
  };

  return (
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-subtle -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--accent)/0.1),transparent_60%)] -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Purpose-Driven Investing</span>
          </div>
          
          {/* Main Headline */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1]">
              Discover Stocks.{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Build Wealth
              </span>{" "}
              with Purpose.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Research any stock, design your investment strategy, and track your goals — all aligned with what matters most to you.
            </p>
          </div>

          {/* Big Search Bar */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search any stock symbol (e.g., AAPL, TSLA, NVDA)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 md:h-18 pl-14 pr-32 text-lg bg-card border-2 border-border hover:border-primary/50 focus:border-primary shadow-card rounded-2xl transition-all"
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
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <span>Try:</span>
              {["AAPL", "TSLA", "NVDA", "MSFT"].map((symbol) => (
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

          {/* CTA Section for new users */}
          {!user && (
            <div className="pt-8 space-y-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" className="group shadow-elegant min-w-[200px]">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#tradlyte-select">
                  <Button size="lg" variant="outline" className="border-2 min-w-[200px]">
                    <Layers className="mr-2 h-5 w-5" />
                    Explore Strategies
                  </Button>
                </a>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>10K+ active users</span>
                </div>
              </div>
            </div>
          )}

          {/* Logged in user - simplified message */}
          {user && (
            <div className="pt-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <p className="text-muted-foreground">
                Welcome back! Search a stock above or{" "}
                <Link to="/dashboard" className="text-primary hover:underline font-medium">
                  go to your dashboard
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
