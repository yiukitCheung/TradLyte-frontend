import { Button } from "@/components/ui/button";
import { TrendingUp, Target, BookOpen, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-gradient-primary opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-4">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Sandbox Testing Environment</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
              Strategic Growth
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Built with Clarity
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Track, analyze, and optimize your financial journey with intelligent tools designed for modern investors.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" variant="default" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                  Start Your Journey
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-6">
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-white">50K+</div>
                <div className="text-sm text-white/70">Goals Achieved</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-white">98%</div>
                <div className="text-sm text-white/70">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-20">
            {/* Mission */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                Our Mission
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                To liberate people from endlessly hunting money and resources — and guide them to discover meaning, direction, and peace through purposeful investing and self-reflection.
              </p>
            </div>

            {/* Vision */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                Our Vision
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                To become the world's most life-centered wealth platform — guiding millions to build financial independence, emotional peace, and a deeper understanding of their true purpose.
              </p>
            </div>

            {/* Values */}
            <div>
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                  Our Values
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Target className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Purpose Over Profit</h3>
                </div>

                <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Clarity Over Noise</h3>
                </div>

                <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Empowerment Through Reflection</h3>
                </div>

                <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Sustainability Over Hype</h3>
                </div>

                <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Target className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Freedom Through Structure</h3>
                </div>

                <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">Authenticity Wins</h3>
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
