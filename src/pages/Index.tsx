import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import MarketIndex from "@/components/MarketIndex";
import Dashboard from "@/components/Dashboard";
import Strategy from "@/components/Strategy";
import Goals from "@/components/Goals";
import Journal from "@/components/Journal";
import FeaturePreview from "@/components/FeaturePreview";
import StrategyBuilderPreview from "@/components/StrategyBuilderPreview";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Stock Search */}
      <Hero />

      <main className="py-8">
        <div className="container mx-auto px-4 space-y-16">
          {/* Market Overview - Always visible */}
          <section id="market" className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Market Overview
              </h2>
              <p className="text-lg text-muted-foreground">
                Real-time market indices and trends
              </p>
            </div>
            <MarketIndex />
          </section>

          {/* Dashboard Section - Only show for logged in users */}
          {user && (
            <section id="dashboard" className="max-w-6xl mx-auto">
              <Dashboard />
            </section>
          )}

          {/* Strategy Builder Section */}
          <section id="strategy-builder" className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Strategy Builder
              </h2>
              <p className="text-lg text-muted-foreground">
                {user 
                  ? "Design and test your investment strategies"
                  : "Try building a simple strategy (Limited preview)"}
              </p>
            </div>
            <StrategyBuilderPreview isAuthenticated={!!user} />
          </section>

          {/* Goals Section */}
          <section id="goals" className="max-w-6xl mx-auto">
            {user ? (
              <>
                <Strategy />
                <div className="mt-8">
                  <Goals />
                </div>
              </>
            ) : (
              <FeaturePreview 
                title="Goal Tracking"
                description="Set and track your financial goals"
                features={[
                  "Custom Goal Creation",
                  "Progress Visualization",
                  "Deadline Management",
                  "Achievement Milestones"
                ]}
                locked
              />
            )}
          </section>

          {/* Journal Section */}
          <section id="journal" className="max-w-6xl mx-auto">
            {user ? (
              <Journal />
            ) : (
              <FeaturePreview 
                title="Reflection Journal"
                description="Track your growth mindset and align wealth with values"
                features={[
                  "Daily Reflection Prompts",
                  "Mood Tracking",
                  "Financial Insights",
                  "Personal Growth Analytics"
                ]}
                locked
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
