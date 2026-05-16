import { ArrowRight, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Hero = () => {
  const { user } = useAuth();

  return (
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-subtle -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--foreground)/0.04),transparent_55%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--accent)/0.12),transparent_52%)] -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center px-5 py-2.5 rounded-pill bg-white border border-black/[0.07] shadow-nav animate-fade-in">
            <span className="design-eyebrow design-eyebrow-dot leading-none">Purpose-driven investing</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-4xl sm:text-5xl md:text-[3rem] lg:text-[4rem] font-display font-medium text-foreground leading-[1] tracking-[-0.02em]">
              Discover stocks.{" "}
              <span className="font-medium text-link underline decoration-link/30 decoration-2 underline-offset-[0.15em]">
                Build wealth
              </span>{" "}
              with purpose.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-[1.4] max-w-2xl mx-auto font-normal">
              Research any stock, design your investment strategy, and track your goals — all aligned with what matters most to you.
            </p>
          </div>

          {/* CTA Section for new users */}
          {!user && (
            <div className="pt-2 space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
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
            <div className="pt-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-muted-foreground">
                Welcome back!{" "}
                <Link to="/dashboard" className="text-primary hover:underline font-medium">
                  Go to your dashboard
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
