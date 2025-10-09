import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import Goals from "@/components/Goals";
import Strategy from "@/components/Strategy";
import Journal from "@/components/Journal";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Dashboard />
        <Goals />
        <Strategy />
        <Journal />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
