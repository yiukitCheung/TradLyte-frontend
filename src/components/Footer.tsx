import { TrendingUp, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-display font-bold text-foreground">Mindful Finance</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Building wealth with clarity, purpose, and mindfulness.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Goals</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Strategy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Journal</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Learn</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Mindful Finance. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-accent fill-accent" /> for mindful investors
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
