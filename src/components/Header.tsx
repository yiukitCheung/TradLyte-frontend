import { TrendingUp, Target, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">Mindful Finance</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </a>
          <a href="#goals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Goals
          </a>
          <a href="#strategy" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Strategy
          </a>
          <a href="#journal" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Journal
          </a>
        </nav>

        <Button variant="default" size="sm" className="hidden md:flex">
          Get Started
        </Button>
      </div>
    </header>
  );
};

export default Header;
