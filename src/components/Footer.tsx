import { Heart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

/** Coral-brand footer: lifted surface + crisp borders — high contrast vs page cream */
const Footer = () => {
  const colHeader = "text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground mb-4";

  const linkClasses =
    "text-sm font-medium text-foreground/90 hover:text-primary transition-colors block leading-relaxed";

  return (
    <footer className="bg-card border-t-2 border-border py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-10 lg:gap-12 mb-12">
          <div className="space-y-5 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
                <TrendingUp className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
              </div>
              <span className="text-xl font-medium tracking-tight text-foreground font-display">TradLyte</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-normal">
              Building wealth with clarity, purpose, and mindfulness — coral highlights, sharper type.
            </p>
          </div>

          <div>
            <h3 className={colHeader}>Platform</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/dashboard" className={linkClasses}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/goals" className={linkClasses}>
                  Goals
                </Link>
              </li>
              <li>
                <Link to="/strategy-builder" className={linkClasses}>
                  Strategy
                </Link>
              </li>
              <li>
                <Link to="/journal" className={linkClasses}>
                  Journal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={colHeader}>Resources</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className={linkClasses}>
                  Learn
                </a>
              </li>
              <li>
                <a href="#" className={linkClasses}>
                  Community <span aria-hidden>↗</span>
                </a>
              </li>
              <li>
                <a href="#" className={linkClasses}>
                  Blog <span aria-hidden>↗</span>
                </a>
              </li>
              <li>
                <a href="#" className={linkClasses}>
                  Support <span aria-hidden>↗</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={colHeader}>Company</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className={linkClasses}>
                  About
                </a>
              </li>
              <li>
                <a href="#" className={linkClasses}>
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className={linkClasses}>
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className={linkClasses}>
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-normal">
          <p>© 2026 TradLyte. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="h-4 w-4 text-primary fill-primary/20" strokeWidth={1.75} /> for mindful investors
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
