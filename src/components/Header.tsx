import { TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display text-primary">TradLyte</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {isHomePage ? (
            <>
              <a href="#market" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Market
              </a>
              <a href="#dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </a>
              <a href="#strategy-builder" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Strategy Builder
              </a>
              <a href="#goals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Goals
              </a>
              <a href="#journal" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Journal
              </a>
            </>
          ) : user && (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/strategy-builder" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Strategy Builder
              </Link>
              <Link to="/goals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Goals
              </Link>
              <Link to="/journal" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Journal
              </Link>
            </>
          )}
          
          {/* Stock Search */}
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 h-9 bg-secondary/50 border-border/50"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </form>
        </nav>

        {user ? (
          <Button onClick={() => signOut()} variant="outline" size="sm" className="hidden md:flex">
            Sign Out
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="default" size="sm" className="hidden md:flex">
              Get Started
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
