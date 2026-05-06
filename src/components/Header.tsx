import { Search, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";

/** DESIGN.md §4 Nav — floating white pill, soft elevation, airy link spacing */
const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const loggedInLinks = (
    <>
      <Link to="/dashboard" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Dashboard
      </Link>
      <Link to="/strategy-builder" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Strategy Builder
      </Link>
      <Link to="/goals" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Goals
      </Link>
      <Link to="/journal" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Journal
      </Link>
    </>
  );

  const guestLinks = (
    <>
      <Link to="/auth" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Dashboard
      </Link>
      <Link to="/auth" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Strategy Builder
      </Link>
      <Link to="/auth" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Goals
      </Link>
      <Link to="/auth" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
        Journal
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 pt-6 pb-2 px-3 sm:px-4 md:px-6">
      <div className="container max-w-[1280px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-pill bg-white/92 backdrop-blur-md border border-black/[0.06] px-5 py-3.5 sm:px-8 sm:py-4 shadow-nav">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-none">
              <TrendingUp className="h-[22px] w-[22px] text-primary-foreground" />
            </div>
            <span className="text-xl md:text-[1.375rem] font-medium tracking-[-0.02em] text-foreground font-display">TradLyte</span>
          </Link>

          <nav className="hidden md:flex flex-1 min-w-0 justify-center items-center gap-8 xl:gap-14 flex-wrap px-2 lg:px-8">
            {isHomePage ? (
              <>
                <a href="#market" className="whitespace-nowrap text-base font-medium text-foreground tracking-tight hover:text-muted-foreground transition-colors">
                  Market
                </a>
                {user ? loggedInLinks : guestLinks}
              </>
            ) : (
              user && loggedInLinks
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="hidden xl:inline-flex">
                  <Button variant="ghost" size="sm" className="rounded-full px-5 gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button type="button" variant="outline" size="sm" className="rounded-full px-6" onClick={() => signOut()}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Get started
                </Button>
              </Link>
            )}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/[0.12] bg-transparent text-foreground hover:bg-accent/70 transition-colors"
              aria-label="Search (coming soon)"
              title="Search — coming soon"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
