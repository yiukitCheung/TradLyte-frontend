import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MarketIndex from '@/components/MarketIndex';
import WisdomQuoteBanner from '@/components/WisdomQuoteBanner';
import EntryPriceGrowth from '@/components/EntryPriceGrowth';
import GrowthChart from '@/components/GrowthChart';
import RegretSystem from '@/components/RegretSystem';
import CooldownPrompt from '@/components/CooldownPrompt';
import FocusModeToggle from '@/components/FocusModeToggle';
import PurposeReminder from '@/components/PurposeReminder';
import { useFocusMode } from '@/hooks/useFocusMode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, Target, BookOpen, Sparkles, BarChart3, 
  ArrowUpRight, ArrowDownRight, Zap, Calendar, Trophy, Brain, 
  Search, Layers, ArrowRight, TrendingDown
} from "lucide-react";
import { isOnboardingComplete, getUserPurpose } from '@/lib/purposeUtils';
import { useCooldown } from '@/hooks/useCooldown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MarketQuoteItem {
  symbol: string;
  close: number | null;
}

interface MarketQuoteResponse {
  data: MarketQuoteItem;
}

interface MarketReturnsResponse {
  data: {
    returns: Record<string, number | null>;
  };
}

interface DashboardIndex {
  name: string;
  symbol: string;
  value: string;
  change: string;
  positive: boolean;
}

interface TopPickRow {
  symbol: string;
  strategyName: string;
  close: number | null;
  return1d: number | null;
  rank: number | null;
}

const MARKET_API_BASE_URL =
  import.meta.env.VITE_MARKET_API_BASE_URL ||
  "https://8p52xermu7.execute-api.ca-west-1.amazonaws.com/v1";
const MARKET_API_KEY =
  import.meta.env.VITE_MARKET_API_KEY || import.meta.env.VITE_SERVING_API_KEY || "";

const DASHBOARD_INDEX_SPECS: Array<{ name: string; symbol: string; isCurrency?: boolean }> = [
  { name: "S&P 500", symbol: "SPY" },
  { name: "NASDAQ", symbol: "QQQ" },
  { name: "Dow Jones", symbol: "DJIA" },
  { name: "Gold", symbol: "GLD", isCurrency: true },
  { name: "Crude Oil", symbol: "USO", isCurrency: true },
];

interface TodayPickItem {
  symbol: string;
  strategy_name: string | null;
  rank: number | null;
  price: string | number | null;
}

interface TodayPicksResponse {
  data: TodayPickItem[];
}

const formatIndexValue = (value: number | null, isCurrency?: boolean) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return isCurrency ? `$${value.toFixed(2)}` : value.toFixed(2);
};

const formatIndexChange = (value: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [journalStats, setJournalStats] = useState({ totalEntries: 0, weekStreak: 0, avgMood: "Neutral" });
  const [topPicks, setTopPicks] = useState<TopPickRow[]>([]);
  const [topPicksLoading, setTopPicksLoading] = useState(false);
  const [marketIndicators, setMarketIndicators] = useState<DashboardIndex[]>([
    { name: "S&P 500", symbol: "SPY", value: "N/A", change: "N/A", positive: true },
    { name: "NASDAQ", symbol: "QQQ", value: "N/A", change: "N/A", positive: true },
    { name: "Dow Jones", symbol: "DJIA", value: "N/A", change: "N/A", positive: true },
    { name: "Gold", symbol: "GLD", value: "N/A", change: "N/A", positive: true },
    { name: "Crude Oil", symbol: "USO", value: "N/A", change: "N/A", positive: true },
  ]);
  const { shouldShowPrompt, enableCooldown, recordProfitableTrade, cooldownEnabled } = useCooldown();
  const { focusMode } = useFocusMode();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isOnboardingComplete()) {
      navigate('/onboarding');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('user_portfolio')
          .select('*')
          .eq('user_id', user.id);
        
        if (portfolioError) throw portfolioError;
        setPortfolioItems(portfolioData || []);
        
        // Check for profitable trades to trigger cooldown
        if (portfolioData && portfolioData.length > 0) {
          const hasProfit = portfolioData.some(item => 
            item.purchase_price && 
            item.current_price && 
            item.current_price > item.purchase_price
          );
          if (hasProfit) {
            recordProfitableTrade();
          }
        }

        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!goalsError && goalsData) {
          setGoals(goalsData.map(goal => ({
            ...goal,
            progress: goal.target_amount && goal.current_amount 
              ? Math.min(100, (parseFloat(goal.current_amount.toString()) / parseFloat(goal.target_amount.toString())) * 100)
              : 0
          })));
        }

        // Fetch journal stats
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id);

        if (!journalError && journalData) {
          setJournalStats({
            totalEntries: journalData.length,
            weekStreak: Math.floor(journalData.length / 7),
            avgMood: "Reflective"
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, recordProfitableTrade]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTopIndices = async () => {
      try {
        const headers: HeadersInit = {};
        if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

        const rows = await Promise.all(
          DASHBOARD_INDEX_SPECS.map(async (spec) => {
            try {
              const [quoteRes, returnsRes] = await Promise.all([
                fetch(`${MARKET_API_BASE_URL}/market/quote/${spec.symbol}`, {
                  headers,
                  signal: controller.signal,
                }),
                fetch(`${MARKET_API_BASE_URL}/market/returns/${spec.symbol}?horizons=1`, {
                  headers,
                  signal: controller.signal,
                }),
              ]);

              if (!quoteRes.ok || !returnsRes.ok) {
                return {
                  name: spec.name,
                  symbol: spec.symbol,
                  value: "N/A",
                  change: "N/A",
                  positive: true,
                };
              }

              const quoteJson = (await quoteRes.json()) as MarketQuoteResponse;
              const returnsJson = (await returnsRes.json()) as MarketReturnsResponse;
              const close = Number(quoteJson.data?.close);
              const change1d = Number(returnsJson.data?.returns?.["1d"]);

              return {
                name: spec.name,
                symbol: spec.symbol,
                value: formatIndexValue(Number.isFinite(close) ? close : null, spec.isCurrency),
                change: formatIndexChange(Number.isFinite(change1d) ? change1d : null),
                positive: Number.isFinite(change1d) ? change1d >= 0 : true,
              };
            } catch {
              return {
                name: spec.name,
                symbol: spec.symbol,
                value: "N/A",
                change: "N/A",
                positive: true,
              };
            }
          })
        );

        setMarketIndicators(rows);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching dashboard indices:", error);
      }
    };

    fetchTopIndices();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDefaultVegasTopPicks = async () => {
      setTopPicksLoading(true);
      try {
        const headers: HeadersInit = {};
        if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

        const picksRes = await fetch(`${MARKET_API_BASE_URL}/picks/today?limit=100`, {
          headers,
          signal: controller.signal,
        });
        if (!picksRes.ok) throw new Error(`Top picks API failed (${picksRes.status})`);
        const picksJson = (await picksRes.json()) as TodayPicksResponse;

        const vegasRows = (picksJson.data || [])
          .filter((item) => (item.strategy_name || "").toLowerCase().includes("vegas_channel"))
          .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
          .slice(0, 10);

        const rows = await Promise.all(
          vegasRows.map(async (pick) => {
            const fallbackPrice = Number(pick.price);
            try {
              const returnsRes = await fetch(`${MARKET_API_BASE_URL}/market/returns/${pick.symbol}?horizons=1`, {
                headers,
                signal: controller.signal,
              });

              if (!returnsRes.ok) {
                return {
                  symbol: pick.symbol,
                  strategyName: pick.strategy_name || "Vegas Channel",
                  close: Number.isFinite(fallbackPrice) ? fallbackPrice : null,
                  return1d: null,
                  rank: pick.rank,
                } satisfies TopPickRow;
              }

              const returnsJson = (await returnsRes.json()) as MarketReturnsResponse;
              const return1d = Number(returnsJson.data?.returns?.["1d"]);

              return {
                symbol: pick.symbol,
                strategyName: pick.strategy_name || "Vegas Channel",
                close: Number.isFinite(fallbackPrice) ? fallbackPrice : null,
                return1d: Number.isFinite(return1d) ? return1d : null,
                rank: pick.rank,
              } satisfies TopPickRow;
            } catch {
              return {
                symbol: pick.symbol,
                strategyName: pick.strategy_name || "Vegas Channel",
                close: Number.isFinite(fallbackPrice) ? fallbackPrice : null,
                return1d: null,
                rank: pick.rank,
              } satisfies TopPickRow;
            }
          })
        );

        setTopPicks(rows);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching default Vegas Channel picks:", error);
      } finally {
        setTopPicksLoading(false);
      }
    };

    fetchDefaultVegasTopPicks();
    return () => controller.abort();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (query) {
      navigate(`/stock/${query}`);
      setSearchQuery("");
    } else {
      toast.error('Please enter a stock symbol');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">
          
          {/* Top Section: Market Indices + Commodities + Search Combined */}
          <div className="space-y-4">
            {/* Market Indices & Commodities */}
            {!focusMode && (
              <Card className="shadow-card border-border/50">
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {marketIndicators.map((indicator) => (
                    <div 
                      key={indicator.symbol} 
                        className="text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                        <div className="text-xs text-muted-foreground mb-1">{indicator.name}</div>
                        <div className="font-semibold font-mono text-sm">{indicator.value}</div>
                      <Badge 
                        variant="secondary" 
                          className={`text-xs mt-1 ${indicator.positive ? 'bg-green-500/10 text-green-600 border-0' : 'bg-red-500/10 text-red-500 border-0'}`}
                      >
                        {indicator.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Stock Search */}
            <Card className="shadow-elegant border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardContent className="py-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                    Start Exploring Things That Can Achieve Your Goal Here
                    </h2>
                    <p className="text-muted-foreground">
                    Discover stocks and investments aligned with your financial purpose
                    </p>
                  </div>
                <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
                    <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                      <Input
                        type="text"
                        placeholder="Search any stock symbol (e.g., AAPL, TSLA, NVDA)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-16 md:h-20 pl-14 pr-36 text-lg md:text-xl bg-background border-2 border-border hover:border-primary/50 focus:border-primary rounded-2xl transition-all shadow-lg"
                      />
                      <Button
                        type="submit"
                        size="lg"
                      className="absolute right-2 top-1/2 -translate-y-1/2 shadow-elegant h-12 px-6"
                      >
                        Analyze
                        <TrendingUp className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                <div className="flex flex-wrap justify-center gap-2 mt-6 text-sm">
                  <span className="text-muted-foreground self-center">Popular:</span>
                  {["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL"].map((symbol) => (
                      <button
                        key={symbol}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/stock/${symbol}`);
                      }}
                      className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 hover:text-primary text-primary font-semibold transition-all border border-primary/20 hover:border-primary/40 hover:scale-105"
                      >
                        {symbol}
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Today's Top 10 Picks
                    </CardTitle>
                    <CardDescription>
                      Default strategy: Vegas Channel
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    Vegas Channel
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topPicksLoading
                    ? Array.from({ length: 10 }).map((_, idx) => (
                        <div key={`top-pick-skeleton-${idx}`} className="p-3 rounded-lg border border-border/50 bg-muted/20 animate-pulse">
                          <div className="h-4 w-14 bg-muted rounded mb-2" />
                          <div className="h-3 w-20 bg-muted rounded" />
                        </div>
                      ))
                    : topPicks.map((pick) => (
                        <button
                          key={pick.symbol}
                          type="button"
                          onClick={() => navigate(`/stock/${pick.symbol}`)}
                          className="text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">{pick.symbol}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              #{pick.rank ?? "-"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pick.close !== null ? `$${pick.close.toFixed(2)}` : "Price N/A"}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 truncate">
                            {pick.strategyName}
                          </div>
                          <div className={`text-xs mt-1 flex items-center gap-1 ${pick.return1d !== null && pick.return1d >= 0 ? "text-primary" : "text-destructive"}`}>
                            {pick.return1d !== null && pick.return1d >= 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {pick.return1d !== null
                              ? `${pick.return1d >= 0 ? "+" : ""}${pick.return1d.toFixed(2)}%`
                              : "Return N/A"}
                          </div>
                        </button>
                      ))}
                </div>
                {!topPicksLoading && topPicks.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No Vegas Channel picks found for today.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Floating Wisdom Quote Banner */}
          <WisdomQuoteBanner />

          {/* Focus Mode Toggle */}
          <div className="flex justify-end">
            <FocusModeToggle />
          </div>

          {/* Growth Summary Scorecard & Growth Chart Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EntryPriceGrowth />
            {!focusMode && <GrowthChart />}
          </div>

          {/* Cooldown Prompt */}
          {shouldShowPrompt && cooldownEnabled && (
            <CooldownPrompt 
              onEnable={enableCooldown}
              onDismiss={() => {}}
            />
          )}

          {/* Portfolio Summary with Tradlyte Scores & % Change */}
          {portfolioItems.length > 0 && (
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Portfolio Summary
                    </CardTitle>
                    <CardDescription>Your holdings with entry-price-based performance</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Zap className="w-3 h-3 mr-1" />
                    {portfolioItems.length} Holding{portfolioItems.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolioItems.map((item) => {
                    const entryPrice = item.purchase_price || 0;
                    const currentPrice = item.current_price || entryPrice;
                    const quantity = item.quantity || 0;
                    const entryValue = entryPrice * quantity;
                    const currentValue = currentPrice * quantity;
                    const gain = currentValue - entryValue;
                    const gainPercent = entryValue > 0 ? (gain / entryValue) * 100 : 0;
                    // Calculate Tradlyte score based on performance (simple algorithm)
                    const score = Math.min(100, Math.max(0, 50 + (gainPercent * 2)));
                    
                    return (
                      <div 
                        key={item.id}
                        className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-semibold text-lg text-foreground">{item.asset_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.asset_type}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Entry: <span className="font-mono">${entryPrice.toFixed(2)}</span> | 
                              Current: <span className="font-mono">${currentPrice.toFixed(2)}</span> | 
                              Qty: <span className="font-mono">{quantity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${gain >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                            </div>
                            <div className={`text-sm ${gainPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-xs text-muted-foreground">Tradlyte Score:</span>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-primary w-8">{Math.round(score)}</span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <RegretSystem 
                              stockSymbol={item.asset_name}
                              industry={item.asset_type}
                              onRegretAdded={() => {
                                // Refresh portfolio
                                window.location.reload();
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goals & Journal Side by Side with Portfolio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Goals Section */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Goal Progress
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    {goals.length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.length > 0 ? (
                  goals.slice(0, 2).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground line-clamp-1">{goal.title}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                          ${goal.current_amount ? parseFloat(goal.current_amount.toString()).toLocaleString() : '0'} / ${goal.target_amount ? parseFloat(goal.target_amount.toString()).toLocaleString() : '0'}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No goals yet</p>
                    <Link to="/goals">
                      <Button size="sm" variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Create Goal
                      </Button>
                    </Link>
                  </div>
                )}
                <Link to="/goals">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Goals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Journal Section */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Journal Insights
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-accent/10 border-accent/30 text-accent">
                    <Calendar className="w-3 h-3 mr-1" />
                    {journalStats.weekStreak} week streak
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-2xl font-bold text-foreground">{journalStats.totalEntries}</div>
                    <div className="text-xs text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-2xl font-bold text-accent">{journalStats.avgMood}</div>
                    <div className="text-xs text-muted-foreground">Avg Mood</div>
                  </div>
                </div>
                <Link to="/journal">
                  <Button variant="ghost" size="sm" className="w-full">
                    <Brain className="h-4 w-4 mr-2" />
                    Start Writing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Purpose Reminder */}
            <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Purpose
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PurposeReminder />
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;
