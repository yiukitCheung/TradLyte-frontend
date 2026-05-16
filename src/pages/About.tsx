import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Compass,
  Heart,
  Brain,
  Target,
  Layers,
  ShieldCheck,
  LineChart,
  BookOpen,
  Users,
  Wand2,
  Gauge,
  Bot,
  TimerReset,
  RefreshCcw,
  Map,
  EyeOff,
  Globe,
  Smartphone,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

/**
 * About page — visual translation of the TradLyte Value Proposition Canvas.
 * Sections: Mission/Vision · Empathise (Jobs) · Pains · Gains
 *           · Pain Relievers · Gain Creators · Values · Roadmap · CTA
 *
 * Design tokens follow DESIGN.md (warm cream canvas, coral primary,
 * pill/stadium radii, design-eyebrow accents).
 */

const customerJobs: Array<{
  category: "Functional" | "Emotional & Social" | "Cognitive";
  icon: typeof Compass;
  title: string;
  body: string;
}> = [
  {
    category: "Functional",
    icon: LineChart,
    title: "Manage and grow wealth sustainably",
    body: "Track portfolio performance and risk tied to entry price — not just generic market metrics.",
  },
  {
    category: "Functional",
    icon: Layers,
    title: "Build a self-directed investment portfolio",
    body: "Discover undervalued opportunities beyond big tech, and design strategic trading and passive income structures you actually understand.",
  },
  {
    category: "Cognitive",
    icon: Brain,
    title: "Think critically about money decisions",
    body: "Understand how to create and refine your own investing strategies — and gain real, reliable knowledge without hype.",
  },
  {
    category: "Emotional & Social",
    icon: Heart,
    title: "Seek financial and mental stability",
    body: "Take control of personal wealth and the future, and find meaning through wealth — not chase it endlessly.",
  },
];

const pains: Array<{ icon: typeof EyeOff; title: string; body: string }> = [
  {
    icon: TimerReset,
    title: "No time to monitor markets",
    body: "Constant research leads to fatigue, missed signals, and false decision-making.",
  },
  {
    icon: EyeOff,
    title: "Tools are generic or hype-driven",
    body: "Finfluencers, noise, and information overload — no trusted place to learn fundamentals.",
  },
  {
    icon: Brain,
    title: "Don't know when or how to buy/sell",
    body: "Emotional swings lead to impulsive or poorly-timed trades and inconsistent returns.",
  },
  {
    icon: Heart,
    title: "Anxiety, fear, and inner conflict",
    body: "Feeling enslaved by money, never feeling like you have \"enough\", chasing wealth instead of growth.",
  },
];

const gains: Array<{
  group: "Required" | "Expected" | "Desired";
  items: string[];
}> = [
  {
    group: "Required",
    items: [
      "Stable, consistent financial growth",
      "Accurate due diligence with clarity",
      "Mitigate risk while maximizing strategic gain",
      "A reliable platform that doesn't confuse users",
    ],
  },
  {
    group: "Expected",
    items: [
      "Learn real-world investing knowledge",
      "Confidently manage and optimize your portfolio",
      "Understand strategy design and decision frameworks",
      "Feel peace of mind in financial decisions",
    ],
  },
  {
    group: "Desired",
    items: [
      "Sustainable income without active day trading",
      "Reframe money as a tool for vision and relationships",
      "Become a mindful, self-directed investor",
      "Live intentionally — wealth aligned with purpose",
    ],
  },
];

const painRelievers: Array<{
  icon: typeof Wand2;
  title: string;
  body: string;
}> = [
  {
    icon: Wand2,
    title: "Sandbox Strategy Builder",
    body: "Click-and-drag system lets users safely design, test, and learn strategies intuitively — reducing fear and confusion.",
  },
  {
    icon: Gauge,
    title: "Risk-Based Portfolio Tracker",
    body: "Tracks growth and risk based on your entry price and personal strategy — not generic market ratings.",
  },
  {
    icon: Bot,
    title: "Automated / Semi-Automated Trading",
    body: "Reduce emotional trading and screen time; enable hands-free income strategies aligned with your plan.",
  },
  {
    icon: Users,
    title: "Transparent Learning Community",
    body: "Users share strategies and trade experience backed by proof, not hype — building trust and clarity.",
  },
  {
    icon: Compass,
    title: "Purpose-Driven UX",
    body: "Reflect on your life goals, not just market movements — restoring mental peace and clarity.",
  },
  {
    icon: Globe,
    title: "Broad Market Coverage",
    body: "Strategies apply to small/mid/large caps, leveraged ETFs, and indices — so you don't miss hidden gems.",
  },
];

const gainCreators: Array<{
  icon: typeof Layers;
  title: string;
  body: string;
}> = [
  {
    icon: Layers,
    title: "No-Code Strategy Designer",
    body: "Build, visualize, and simulate custom strategies without writing a line of code.",
  },
  {
    icon: Bot,
    title: "Automated & Guided Portfolio Execution",
    body: "Semi/full automated trading execution aligned to the strategy you designed.",
  },
  {
    icon: Gauge,
    title: "Dynamic Risk-Return Tracking",
    body: "Track growth and risk based on entry price, not just headline market metrics.",
  },
  {
    icon: BookOpen,
    title: "Curated Knowledge Base",
    body: "High-trust learning content, strategy templates, and case studies with real results.",
  },
  {
    icon: Heart,
    title: "Life Alignment Engine",
    body: "Reflective questions, quotes, and goal tracking — gently nudging you to think of values and purpose while trading.",
  },
  {
    icon: Globe,
    title: "Market-Wide Strategy Deployment",
    body: "Apply your strategies to any stock, ETF, or asset class — wherever opportunity hides.",
  },
  {
    icon: BookOpen,
    title: "Wisdom-Based Design",
    body: "Quotes from investors and philosophers instilling resilience, balance, and deeper thinking.",
  },
  {
    icon: TimerReset,
    title: "Post-Win Cooldown System",
    body: "Recommends breaks after emotional wins — reducing addiction and overtrading cycles.",
  },
  {
    icon: Map,
    title: "Personal Investing Pathway",
    body: "A gamified map of your growth stages — a legacy story of self-growth you can pass on.",
  },
  {
    icon: EyeOff,
    title: "Noise-Filtering UX",
    body: "Minimal charts and metrics — only show information truly related to holding decisions.",
  },
  {
    icon: RefreshCcw,
    title: "Regret System",
    body: "Log reflective regrets on trades and get gentle reminders the next time you face a similar setup.",
  },
];

const values: string[] = [
  "Purpose Over Profit",
  "Clarity Over Noise",
  "Empowerment Through Reflection",
  "Sustainability Over Hype",
  "Freedom Through Structure",
  "Authenticity Wins",
];

const About = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero — Mission */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--foreground)/0.04),transparent_55%)] -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--accent)/0.10),transparent_52%)] -z-10" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center px-5 py-2.5 rounded-pill bg-white border border-black/[0.07] shadow-nav animate-fade-in">
              <span className="design-eyebrow design-eyebrow-dot leading-none">About TradLyte</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-display font-medium text-foreground leading-[1.05] tracking-[-0.02em] animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Investing as a path to{" "}
              <span className="text-link underline decoration-link/30 decoration-2 underline-offset-[0.15em]">
                meaning
              </span>
              , not just money.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-[1.5] max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              TradLyte exists to liberate people from endlessly hunting money and resources — and guide them
              to discover meaning, direction, and peace through purposeful investing and self-reflection.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Mission & Vision */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-6">
            <Card className="rounded-stadium shadow-card border-border/60 bg-white">
              <CardHeader className="pb-3">
                <span className="design-eyebrow design-eyebrow-dot">Mission</span>
                <CardTitle className="text-2xl md:text-3xl font-display font-medium leading-tight tracking-[-0.02em] mt-3">
                  Liberate people from endlessly hunting money.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Guide users to discover meaning, direction, and peace through purposeful investing and
                  honest self-reflection — so wealth becomes a tool, not a master.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-stadium shadow-card border-border/60 bg-white">
              <CardHeader className="pb-3">
                <span className="design-eyebrow design-eyebrow-dot">Vision</span>
                <CardTitle className="text-2xl md:text-3xl font-display font-medium leading-tight tracking-[-0.02em] mt-3">
                  The world's most life-centered wealth platform.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Guiding millions to build financial independence, emotional peace, and a deeper
                  understanding of their true purpose.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Empathise — Customer Jobs */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <span className="design-eyebrow design-eyebrow-dot">Empathise · Step 01</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em] mt-4 mb-3">
                Who we build for
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Self-directed investors who want growth, clarity, and balance — not a casino dressed up as a
                trading app.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {customerJobs.map(({ icon: Icon, title, body, category }) => (
                <Card key={title} className="rounded-stadium shadow-card border-border/60 bg-white">
                  <CardContent className="p-7 flex gap-5">
                    <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <span className="design-eyebrow text-muted-foreground">{category}</span>
                      <h3 className="text-lg font-display font-medium tracking-[-0.01em] text-foreground">
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pains & Gains */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <span className="design-eyebrow design-eyebrow-dot">Define · Step 02</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em] mt-4 mb-3">
                What gets in the way — and what we want instead
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Pains */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-9 w-9 rounded-full bg-destructive/15 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="text-xl font-display font-medium tracking-[-0.01em]">Pains we relieve</h3>
                </div>
                <div className="space-y-3">
                  {pains.map(({ icon: Icon, title, body }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-border/60 bg-white p-5 flex gap-4 shadow-card"
                    >
                      <div className="shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-medium tracking-[-0.01em] text-foreground">
                          {title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gains */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-medium tracking-[-0.01em]">Gains we create</h3>
                </div>
                <div className="space-y-3">
                  {gains.map(({ group, items }) => (
                    <div
                      key={group}
                      className="rounded-2xl border border-border/60 bg-white p-5 shadow-card"
                    >
                      <span className="design-eyebrow design-eyebrow-dot">{group} gains</span>
                      <ul className="mt-3 space-y-2">
                        {items.map((item) => (
                          <li key={item} className="text-sm text-foreground/90 flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Relievers */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <span className="design-eyebrow design-eyebrow-dot">Define · Pain Relievers</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em] mt-4 mb-3">
                How TradLyte calms the chaos
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Tools that turn anxious, reactive trading into a structured practice you can sustain.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {painRelievers.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="rounded-stadium shadow-card border-border/60 bg-white h-full">
                  <CardContent className="p-7 space-y-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-medium tracking-[-0.01em] text-foreground">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gain Creators */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <span className="design-eyebrow design-eyebrow-dot">Ideate · Gain Creators</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em] mt-4 mb-3">
                The product, one feature at a time
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Each feature is a deliberate answer to a job, pain, or gain — never a feature for its own sake.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gainCreators.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="rounded-stadium shadow-card border-border/60 bg-white h-full">
                  <CardContent className="p-7 space-y-4">
                    <div className="h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-display font-medium tracking-[-0.01em] text-foreground">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <span className="design-eyebrow design-eyebrow-dot">Our values</span>
            <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em] mt-4 mb-10">
              The principles that keep us honest
            </h2>

            <div className="flex flex-wrap justify-center gap-3">
              {values.map((value) => (
                <span
                  key={value}
                  className="px-5 py-2.5 rounded-pill bg-white border border-black/[0.07] shadow-nav text-sm md:text-base font-medium text-foreground tracking-tight"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <span className="design-eyebrow design-eyebrow-dot">Roadmap</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em] mt-4 mb-3">
                Where we're going
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-stadium shadow-card border-border/60 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span className="design-eyebrow text-muted-foreground">Phase 1</span>
                      <CardTitle className="text-2xl font-display font-medium tracking-[-0.02em]">
                        Web App
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-foreground/90">
                    {[
                      "User onboarding",
                      "Story-driven trading journey builder",
                      "Strategy lab",
                      "Sharing and community",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-stadium shadow-card border-border/60 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <span className="design-eyebrow text-muted-foreground">Phase 2</span>
                      <CardTitle className="text-2xl font-display font-medium tracking-[-0.02em]">
                        Mobile App
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-foreground/90">
                    {[
                      "Micro-missions",
                      "Notifications",
                      "Progress tracking",
                      "Daily journalling",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto rounded-stadium bg-gradient-primary text-primary-foreground p-10 md:p-14 shadow-elegant text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-display font-medium tracking-[-0.02em]">
                Build wealth that actually serves your life.
              </h2>
              <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
                Start free — design a strategy, track progress, and reflect on what you really want money to do
                for you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg" variant="secondary" className="min-w-[220px] shadow-card">
                      <Target className="mr-2 h-5 w-5" />
                      Open my dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="min-w-[220px] shadow-card">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start your journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-w-[220px] bg-white/10 text-primary-foreground border-white/40 hover:bg-white/20 hover:text-primary-foreground"
                  >
                    <Layers className="mr-2 h-5 w-5" />
                    Explore strategies
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
