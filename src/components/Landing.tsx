import { Button } from "@/components/ui/button";
import { TrendingUp, Target, BookOpen, Shield, ArrowRight, BarChart3, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Asymmetric Split Layout */}
      <section className="relative min-h-screen grid lg:grid-cols-2 gap-8 items-center">
        {/* Animated Background with Pattern */}
        <div className="absolute inset-0 bg-gradient-subtle"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow"></div>
          <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: "1.5s" }}></div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 container mx-auto px-4 lg:px-12 py-20 lg:py-0">
          <div className="space-y-8 max-w-2xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Purpose-Driven Wealth Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold text-foreground leading-[1.05]">
              Build Wealth
              <span className="block text-transparent bg-clip-text bg-gradient-primary mt-2">
                With Purpose
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground leading-relaxed max-w-3xl">
              Stop chasing money. Start discovering meaning. TradLyte guides you to financial independence through purposeful investing and deep self-reflection.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="group text-lg px-8 py-6 shadow-elegant">
                  Begin Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <button className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
                Watch Demo <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Privacy-first</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Visual - Bento Grid */}
        <div className="relative z-10 hidden lg:flex items-center justify-center px-8 py-20">
          <div className="grid grid-cols-2 gap-4 w-full max-w-xl animate-slide-up">
            {/* Card 1 - Stats */}
            <div className="col-span-2 p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-card hover:shadow-elegant transition-all duration-300 group">
              <div className="flex items-center justify-between mb-6">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">$2.4M</div>
                  <div className="text-sm text-muted-foreground">Total Growth</div>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary w-3/4 rounded-full"></div>
              </div>
            </div>

            {/* Card 2 - Quick Stat */}
            <div className="p-6 rounded-2xl bg-gradient-primary text-white shadow-elegant hover:scale-105 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 mb-4" />
              <div className="text-4xl font-bold mb-1">+127%</div>
              <div className="text-sm opacity-90">Avg. Returns</div>
            </div>

            {/* Card 3 - Users */}
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border hover:scale-105 transition-transform duration-300">
              <Target className="h-6 w-6 text-primary mb-4" />
              <div className="text-4xl font-bold text-foreground mb-1">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>

            {/* Card 4 - Feature Highlight */}
            <div className="col-span-2 p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Reflection Journal</div>
                  <div className="text-sm text-muted-foreground">Track your growth mindset</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Journey Section */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Card 1 - From */}
            <div className="group relative p-12 rounded-3xl bg-muted/50 border border-border overflow-hidden hover:border-primary/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-6xl font-display font-bold text-foreground/30 mb-4">01</div>
                <h3 className="text-3xl font-display font-bold text-foreground mb-4">Track</h3>
                <p className="text-lg text-muted-foreground">Monitor wealth growth</p>
              </div>
            </div>

            {/* Card 2 - Through */}
            <div className="group relative p-12 rounded-3xl bg-gradient-primary text-white overflow-hidden hover:scale-[1.02] transition-all duration-500 shadow-elegant">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="text-6xl font-display font-bold text-white/40 mb-4">02</div>
                <h3 className="text-3xl font-display font-bold mb-4">Reflect</h3>
                <p className="text-lg opacity-90">Discover your values</p>
              </div>
            </div>

            {/* Card 3 - To */}
            <div className="group relative p-12 rounded-3xl bg-card border border-primary/20 overflow-hidden hover:border-primary/60 hover:shadow-elegant transition-all duration-500">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div className="text-6xl font-display font-bold text-primary/40 mb-4">03</div>
                <h3 className="text-3xl font-display font-bold text-foreground mb-4">Transform</h3>
                <p className="text-lg text-muted-foreground">Become who you want to be</p>
              </div>
            </div>
          </div>

          {/* Subtle message below */}
          <div className="text-center mt-16 max-w-3xl mx-auto">
            <p className="text-2xl text-muted-foreground/60 italic">
              Wealth is the tool. Purpose is the destination.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section - Modern Card Layout */}
      <section className="py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-20 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              Our Purpose
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-foreground">
              Mission & Vision
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
            {/* Mission Card */}
            <div className="group p-10 rounded-3xl bg-card border border-border hover:border-primary/40 hover:shadow-elegant transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">Our Mission</h3>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                To liberate people from endlessly hunting money and resources — and guide them to discover meaning, direction, and peace through purposeful investing and self-reflection.
              </p>
            </div>

            {/* Vision Card */}
            <div className="group p-10 rounded-3xl bg-gradient-primary text-white hover:shadow-elegant transition-all duration-500 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-display font-bold mb-6">Our Vision</h3>
              <p className="text-xl md:text-2xl leading-relaxed opacity-95">
                To become the world's most life-centered wealth platform — guiding millions to build financial independence, emotional peace, and a deeper understanding of their true purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Bento Grid Layout */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-20 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
              What Drives Us
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-foreground">
              Our Core Values
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              { icon: Target, title: "Purpose Over Profit", gradient: "from-primary to-primary-glow" },
              { icon: BookOpen, title: "Clarity Over Noise", gradient: "from-accent to-accent-glow" },
              { icon: Shield, title: "Empowerment Through Reflection", gradient: "from-primary to-accent" },
              { icon: TrendingUp, title: "Sustainability Over Hype", gradient: "from-accent to-primary" },
              { icon: Target, title: "Freedom Through Structure", gradient: "from-primary to-primary-glow" },
              { icon: Shield, title: "Authenticity Wins", gradient: "from-accent to-accent-glow" },
            ].map((value, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <value.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main CTA Card */}
            <div className="relative rounded-3xl bg-gradient-primary p-12 md:p-16 lg:p-20 overflow-hidden shadow-elegant">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
                <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
                  Ready to Transform Your Financial Future?
                </h2>
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                  Join thousands discovering purpose through strategic wealth building.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="text-lg px-10 py-6 shadow-2xl hover:scale-105 transition-transform">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <button className="text-white hover:text-white/80 transition-colors font-medium flex items-center gap-2 text-lg">
                    See How It Works <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto border-t border-white/20">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">10K+</div>
                    <div className="text-sm text-white/70">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">$2.4M</div>
                    <div className="text-sm text-white/70">Assets Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">98%</div>
                    <div className="text-sm text-white/70">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Below */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Bank-Level Security</h4>
                  <p className="text-sm text-muted-foreground">Your data is encrypted and protected</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Purpose-Driven</h4>
                  <p className="text-sm text-muted-foreground">Align wealth with your values</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Free to Start</h4>
                  <p className="text-sm text-muted-foreground">No credit card required</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
