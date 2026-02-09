import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import Strategy from "@/components/Strategy";
import Goals from "@/components/Goals";
import Journal from "@/components/Journal";
import FeaturePreview from "@/components/FeaturePreview";
import TradlyteSelect from "@/components/TradlyteSelect";

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section with Stock Search */}
      <Hero />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 space-y-16">
          {/* Tradlyte Select - Strategy Showcase */}
          <section id="tradlyte-select" className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Tradlyte Select
              </h2>
              <p className="text-lg text-muted-foreground">
                Curated strategies outperforming the market
              </p>
            </div>
            <TradlyteSelect />
          </section>

          {/* Dashboard Section - Only show for logged in users */}
          {user && (
            <section id="dashboard" className="max-w-6xl mx-auto">
              <Dashboard />
            </section>
          )}

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
