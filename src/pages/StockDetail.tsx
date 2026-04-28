import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegretWarning from "@/components/RegretWarning";
import PurposeAlignmentCheck from "@/components/PurposeAlignmentCheck";
import FocusModeToggle from "@/components/FocusModeToggle";
import { useFocusMode } from "@/hooks/useFocusMode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Check, Loader2, Newspaper, ExternalLink, MessageSquare, Send, Building, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mascotImage from "@/assets/tradlyte-mascot.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { checkSimilarRegrets } from "@/lib/regretUtils";

type TimePeriod = "1D" | "6M" | "YTD" | "1Y" | "5Y";
type OhlcvInterval = "1d" | "1h" | "15m" | "5m" | "1m";

interface MarketQuoteItem {
  symbol: string;
  name: string | null;
  industry: string | null;
  market_cap: number | null;
  type: string | null;
  primary_exchange: string | null;
  as_of_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

interface MarketQuoteResponse {
  data: MarketQuoteItem;
}

interface OhlcvItem {
  symbol: string;
  interval: string;
  timestamp: string;
  trading_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

interface OhlcvResponse {
  data: OhlcvItem[];
}

interface MarketReturnsResponse {
  data: {
    symbol: string;
    returns: Record<string, number | null>;
  };
}

interface PricePoint {
  date: string;
  price: number;
}

interface CorrelatedIndicator {
  name: string;
  symbol: string;
  price: number | null;
  change: number | null;
}

const MARKET_API_BASE_URL =
  import.meta.env.VITE_MARKET_API_BASE_URL ||
  "https://8p52xermu7.execute-api.ca-west-1.amazonaws.com/v1";
const MARKET_API_KEY =
  import.meta.env.VITE_MARKET_API_KEY || import.meta.env.VITE_SERVING_API_KEY || "";

const CORRELATED_INDICATOR_SYMBOLS: Array<{ name: string; symbol: string }> = [
  { name: "S&P 500", symbol: "SPY" },
  { name: "NASDAQ", symbol: "QQQ" },
  { name: "Dow Jones", symbol: "DJIA" },
  { name: "Gold", symbol: "GLD" },
  { name: "Silver", symbol: "SLV" },
  { name: "Crude Oil", symbol: "USO" },
];

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const mapPeriodToOhlcvParams = (period: TimePeriod) => {
  const endDate = new Date();
  let startDate = new Date(endDate);
  let interval: OhlcvInterval = "1d";
  let limit = 400;

  switch (period) {
    case "1D":
      interval = "1h";
      startDate.setDate(endDate.getDate() - 2);
      limit = 72;
      break;
    case "6M":
      interval = "1d";
      startDate.setDate(endDate.getDate() - 180);
      limit = 220;
      break;
    case "YTD":
      interval = "1d";
      startDate = new Date(endDate.getFullYear(), 0, 1);
      limit = 300;
      break;
    case "1Y":
      interval = "1d";
      startDate.setDate(endDate.getDate() - 365);
      limit = 420;
      break;
    case "5Y":
      interval = "1d";
      startDate.setDate(endDate.getDate() - 365 * 5);
      limit = 2000;
      break;
  }

  return {
    interval,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    limit,
  };
};

const formatMarketCap = (value: number | null) => {
  if (value === null || value === undefined) return "N/A";
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString();
};

const formatCurrency = (value: number | null, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return `$${value.toFixed(digits)}`;
};

const formatInteger = (value: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return value.toLocaleString();
};

const toSafeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const generateFallbackPriceData = (period: TimePeriod): PricePoint[] => {
  const data: PricePoint[] = [];
  let days = 30;
  switch (period) {
    case "1D":
      days = 1;
      break;
    case "6M":
      days = 180;
      break;
    case "YTD":
      days = Math.floor(
        (new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      break;
    case "1Y":
      days = 365;
      break;
    case "5Y":
      days = 1825;
      break;
  }

  let price = 165;
  const interval = period === "1D" ? 24 : Math.min(days, 60);
  const step = Math.max(1, Math.floor(days / interval));

  for (let i = days; i >= 0; i -= step) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    price = price + (Math.random() - 0.48) * (period === "5Y" ? 5 : 2);
    data.push({
      date: date.toISOString(),
      price: parseFloat(Math.max(100, price).toFixed(2)),
    });
  }
  return data;
};

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if no symbol
  useEffect(() => {
    if (!symbol) {
      navigate('/dashboard');
      return;
    }
  }, [symbol, navigate]);
  
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [buyInPrice, setBuyInPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1Y");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([
    { role: 'ai', text: `Hi! I'm your Tradlyte AI assistant for ${symbol || "this stock"}. I can help you analyze this stock based on your portfolio and strategy. Ask me anything about entry points, risks, or how it fits your investment goals!` }
  ]);
  const [similarRegret, setSimilarRegret] = useState<any>(null);
  const [showPurposeCheck, setShowPurposeCheck] = useState(false);
  const [purposeAlignment, setPurposeAlignment] = useState<{ aligned: string; reason: string } | null>(null);
  const { focusMode } = useFocusMode();
  const [quoteData, setQuoteData] = useState<MarketQuoteItem | null>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [correlatedIndicators, setCorrelatedIndicators] = useState<CorrelatedIndicator[]>(
    CORRELATED_INDICATOR_SYMBOLS.map((item) => ({ ...item, price: null, change: null }))
  );

  // Helper function to get stock name
  const getStockName = (sym: string): string => {
    const names: Record<string, string> = {
      AAPL: "Apple Inc.", 
      GOOGL: "Alphabet Inc.", 
      MSFT: "Microsoft Corporation",
      AMZN: "Amazon.com Inc.", 
      TSLA: "Tesla Inc.", 
      META: "Meta Platforms Inc.", 
      NVDA: "NVIDIA Corporation",
      SPY: "SPDR S&P 500 ETF",
      QQQ: "Invesco QQQ Trust",
    };
    return names[sym] || `${sym} Inc.`;
  };

  // Fetch real market quote + chart data from serving API
  useEffect(() => {
    if (!symbol) return;

    const controller = new AbortController();
    const fetchMarketData = async () => {
      setMarketLoading(true);
      try {
        setUsingFallbackData(false);
        const quoteUrl = `${MARKET_API_BASE_URL}/market/quote/${symbol.toUpperCase()}`;
        const ohlcvParams = mapPeriodToOhlcvParams(selectedPeriod);
        const ohlcvUrl = new URL(`${MARKET_API_BASE_URL}/market/ohlcv/${symbol.toUpperCase()}`);
        ohlcvUrl.searchParams.set("interval", ohlcvParams.interval);
        ohlcvUrl.searchParams.set("start_date", ohlcvParams.startDate);
        ohlcvUrl.searchParams.set("end_date", ohlcvParams.endDate);
        ohlcvUrl.searchParams.set("limit", String(ohlcvParams.limit));
        ohlcvUrl.searchParams.set("sort", "asc");

        const headers: HeadersInit = {};
        if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

        const [quoteRes, ohlcvRes] = await Promise.all([
          fetch(quoteUrl, { headers, signal: controller.signal }),
          fetch(ohlcvUrl.toString(), { headers, signal: controller.signal }),
        ]);

        if (!quoteRes.ok) throw new Error(`Quote API failed (${quoteRes.status})`);
        if (!ohlcvRes.ok) throw new Error(`OHLCV API failed (${ohlcvRes.status})`);

        const quoteJson = (await quoteRes.json()) as MarketQuoteResponse;
        const ohlcvJson = (await ohlcvRes.json()) as OhlcvResponse;

        const mappedPriceData = (ohlcvJson.data || [])
          .filter((p) => p.close !== null)
          .map((p) => ({
            date: p.timestamp || p.trading_date,
            price: Number(p.close),
          }));

        if (mappedPriceData.length === 0) {
          throw new Error("OHLCV API returned no data");
        }

        setQuoteData(quoteJson.data);
        setPriceData(
          (ohlcvJson.data || [])
            .filter((p) => p.close !== null)
            .map((p) => ({
              date: p.timestamp || p.trading_date,
              price: Number(p.close),
            }))
        );
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching market data:", error);
        setUsingFallbackData(true);
        setQuoteData(null);
        setPriceData(generateFallbackPriceData(selectedPeriod));
        toast.error("Live market API unavailable. Showing fallback data.");
      } finally {
        setMarketLoading(false);
      }
    };

    fetchMarketData();
    return () => controller.abort();
  }, [symbol, selectedPeriod]);

  // Fetch correlated indicators (SPY, QQQ, DJIA, GLD, SLV, USO)
  useEffect(() => {
    const controller = new AbortController();
    const fetchCorrelatedIndicators = async () => {
      try {
        const headers: HeadersInit = {};
        if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

        const rows = await Promise.all(
          CORRELATED_INDICATOR_SYMBOLS.map(async ({ name, symbol: indexSymbol }) => {
            try {
              const [quoteRes, returnsRes] = await Promise.all([
                fetch(`${MARKET_API_BASE_URL}/market/quote/${indexSymbol}`, {
                  headers,
                  signal: controller.signal,
                }),
                fetch(`${MARKET_API_BASE_URL}/market/returns/${indexSymbol}?horizons=1`, {
                  headers,
                  signal: controller.signal,
                }),
              ]);

              if (!quoteRes.ok || !returnsRes.ok) {
                return { name, symbol: indexSymbol, price: null, change: null };
              }

              const quoteJson = (await quoteRes.json()) as MarketQuoteResponse;
              const returnsJson = (await returnsRes.json()) as MarketReturnsResponse;
              return {
                name,
                symbol: indexSymbol,
                price: toSafeNumber(quoteJson.data?.close),
                change: toSafeNumber(returnsJson.data?.returns?.["1d"]),
              };
            } catch {
              return { name, symbol: indexSymbol, price: null, change: null };
            }
          })
        );

        setCorrelatedIndicators(rows);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching correlated indicators:", error);
      }
    };

    fetchCorrelatedIndicators();
    return () => controller.abort();
  }, [symbol]);

  const priceChange = priceData.length > 1 ? priceData[priceData.length - 1].price - priceData[0].price : 0;
  const priceChangePercent = priceData.length > 1 ? (priceChange / priceData[0].price) * 100 : 0;

  // Stock data - memoized to prevent recreation
  const stockData = useMemo(() => {
    const quoteOpen = toSafeNumber(quoteData?.open);
    const quoteClose = toSafeNumber(quoteData?.close);
    const quoteHigh = toSafeNumber(quoteData?.high);
    const quoteLow = toSafeNumber(quoteData?.low);
    const quoteVolume = toSafeNumber(quoteData?.volume);
    const quoteMarketCap = toSafeNumber(quoteData?.market_cap);

    return {
      symbol: symbol || "AAPL",
      name: quoteData?.name || getStockName(symbol || "AAPL"),
      price: quoteClose ?? (priceData.length > 0 ? priceData[priceData.length - 1].price : 178.45),
      change: priceChange,
      changePercent: priceChangePercent,
      industry: quoteData?.industry || "Unknown",
      sector: quoteData?.type || "Common Stock",
    recommendationScore: user ? 87 : 72,
    strategyName: user ? "Growth & Value Mix" : "Default Strategy",
    portfolioGrowth: user ? "+12.4%" : null,
    correlatedIndices: correlatedIndicators,
    news: [
      { title: `${symbol || "AAPL"} Reports Strong Q4 Earnings`, source: "Reuters", time: "2h ago" },
      { title: `Analysts Upgrade ${symbol || "AAPL"} Following Product Launch`, source: "Bloomberg", time: "5h ago" },
      { title: `${symbol || "AAPL"} Expands AI Capabilities`, source: "CNBC", time: "1d ago" },
    ],
    fundamentals: {
      marketCap: formatMarketCap(quoteMarketCap),
      open: quoteOpen,
      close: quoteClose,
      dayHigh: quoteHigh ?? (priceData.length > 0 ? Math.max(...priceData.map((p) => p.price)) : null),
      dayLow: quoteLow ?? (priceData.length > 0 ? Math.min(...priceData.map((p) => p.price)) : null),
      volume: quoteVolume,
    },
    };
  }, [symbol, quoteData, priceData, user, priceChange, priceChangePercent, correlatedIndicators]);

  // Check for similar regrets after stockData is defined
  useEffect(() => {
    if (symbol && stockData) {
      const regret = checkSimilarRegrets(symbol, stockData.industry);
      setSimilarRegret(regret);
    }
  }, [symbol, stockData]);

  // Check portfolio
  useEffect(() => {
    const checkPortfolio = async () => {
      if (!user || !symbol) {
        setPortfolioLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('user_portfolio')
          .select('id')
          .eq('user_id', user.id)
          .eq('asset_name', symbol)
          .maybeSingle();
        if (error) throw error;
        setIsInPortfolio(!!data);
      } catch (error) {
        console.error('Error checking portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    };
    if (!authLoading) checkPortfolio();
  }, [user, symbol, authLoading]);

  const handleAddToPortfolio = async () => {
    if (!user || !symbol || !purposeAlignment) return;
    const price = parseFloat(buyInPrice);
    const qty = parseFloat(quantity);
    if (isNaN(price) || price <= 0) { toast.error("Please enter a valid buy-in price"); return; }
    if (isNaN(qty) || qty <= 0) { toast.error("Please enter a valid quantity"); return; }
    setIsAdding(true);
    try {
      const { error } = await supabase.from('user_portfolio').insert({
        user_id: user.id,
        asset_name: symbol,
        asset_type: 'stock',
        purchase_price: price,
        current_price: stockData.price,
        quantity: qty,
      });
      if (error) throw error;
      setIsInPortfolio(true);
      setAddDialogOpen(false);
      setPurposeAlignment(null);
      toast.success(`${symbol} added to your portfolio!`);
      setBuyInPrice("");
      setQuantity("1");
    } catch (error: any) {
      toast.error(error.message || "Failed to add to portfolio");
    } finally {
      setIsAdding(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-accent";
    return "text-muted-foreground";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Strong Buy";
    if (score >= 60) return "Buy";
    if (score >= 40) return "Hold";
    return "Sell";
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: chatInput },
      { role: 'ai', text: `Based on your ${stockData.strategyName} strategy and current market conditions, ${symbol} shows strong momentum. The stock aligns well with your growth objectives. Consider current trend, volume, and day range before entering.` }
    ]);
    setChatInput("");
  };

  const timePeriods: TimePeriod[] = ["1D", "6M", "YTD", "1Y", "5Y"];

  // Show loading or redirect if no symbol
  if (!symbol) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Back Button & Focus Mode Toggle */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <FocusModeToggle />
          </div>

          {/* Regret Warning */}
          {similarRegret && (
            <div className="max-w-6xl mx-auto mb-6">
              <RegretWarning 
                regret={similarRegret}
                onDismiss={() => setSimilarRegret(null)}
              />
            </div>
          )}

          {/* Hero: Symbol Info + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Symbol, Price, Info */}
            <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-5xl font-display font-bold text-foreground">{stockData.symbol}</h1>
                      {user && !authLoading && (
                        portfolioLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : isInPortfolio ? (
                          <Badge variant="outline" className="text-primary border-primary"><Check className="mr-1 h-3 w-3" />In Portfolio</Badge>
                        ) : (
                          <Dialog open={addDialogOpen} onOpenChange={(open) => {
                            setAddDialogOpen(open);
                            if (!open) {
                              setPurposeAlignment(null);
                              setBuyInPrice("");
                              setQuantity("1");
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Add {symbol} to Portfolio</DialogTitle>
                                <DialogDescription>Let's check purpose alignment first, then enter your details.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {!purposeAlignment ? (
                                  <PurposeAlignmentCheck
                                    stockSymbol={symbol || ""}
                                    onComplete={(alignment) => {
                                      setPurposeAlignment(alignment);
                                    }}
                                    onSkip={() => {
                                      setPurposeAlignment({ aligned: 'not_sure', reason: '' });
                                    }}
                                  />
                                ) : (
                                  <>
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                      <p className="text-sm text-muted-foreground mb-1">Purpose Alignment:</p>
                                      <p className="text-sm font-medium text-foreground capitalize">{purposeAlignment.aligned.replace('_', ' ')}</p>
                                      {purposeAlignment.reason && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">"{purposeAlignment.reason}"</p>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="buyInPrice">Buy-in Price ($)</Label>
                                      <Input 
                                        id="buyInPrice" 
                                        type="number" 
                                        step="0.01" 
                                        min="0" 
                                        placeholder={stockData.price.toString()} 
                                        value={buyInPrice} 
                                        onChange={(e) => setBuyInPrice(e.target.value)} 
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="quantity">Quantity (shares)</Label>
                                      <Input 
                                        id="quantity" 
                                        type="number" 
                                        step="1" 
                                        min="1" 
                                        placeholder="1" 
                                        value={quantity} 
                                        onChange={(e) => setQuantity(e.target.value)} 
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setAddDialogOpen(false);
                                  setPurposeAlignment(null);
                                  setBuyInPrice("");
                                  setQuantity("1");
                                }}>Cancel</Button>
                                {purposeAlignment && (
                                  <Button onClick={handleAddToPortfolio} disabled={isAdding || !buyInPrice || !quantity}>
                                    {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add to Portfolio"}
                                  </Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-4">{stockData.name}</p>
                    {usingFallbackData && (
                      <p className="text-xs text-amber-600 mb-3">
                        Live feed unavailable, showing fallback data.
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{stockData.industry}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{stockData.sector}</span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-4xl font-bold text-foreground">${stockData.price.toFixed(2)}</span>
                    <span className={`flex items-center gap-1 text-lg font-semibold ${stockData.change >= 0 ? "text-primary" : "text-destructive"}`}>
                      {stockData.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      {stockData.change >= 0 ? "+" : ""}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Recommendation Score */}
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Recommendation</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{stockData.strategyName}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-4xl font-bold ${getScoreColor(stockData.recommendationScore)}`}>
                      {stockData.recommendationScore}
                    </span>
                    <div className="flex-1">
                      <Progress value={stockData.recommendationScore} className="h-2 mb-1" />
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${getScoreColor(stockData.recommendationScore)}`}>
                          {getScoreLabel(stockData.recommendationScore)}
                        </span>
                        {user && stockData.portfolioGrowth && (
                          <span className="text-xs text-primary font-medium">Portfolio: {stockData.portfolioGrowth}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Minimal Chart (Hidden in Focus Mode) */}
            {!focusMode && (
              <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardContent className="pt-6 h-full flex flex-col">
                  {/* Time Period Selector */}
                  <div className="flex gap-1 mb-4">
                    {timePeriods.map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? "default" : "ghost"}
                        size="sm"
                        className="text-xs px-3"
                        onClick={() => setSelectedPeriod(period)}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="flex-1 min-h-[200px]">
                    {marketLoading ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading market data...
                      </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceData}>
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                          labelFormatter={() => ''}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={priceChange >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Open</p>
                      <p className="font-semibold text-sm">{formatCurrency(stockData.fundamentals.open)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Close</p>
                      <p className="font-semibold text-sm">{formatCurrency(stockData.fundamentals.close)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Volume</p>
                      <p className="font-semibold text-sm">{formatInteger(stockData.fundamentals.volume)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content: AI Chat */}
          <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-card/50 mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <img src={mascotImage} alt="Tradlyte" className="w-12 h-12 rounded-full" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Tradlyte AI Analyst
                  </CardTitle>
                  <CardDescription>Personalized insights based on your strategy and portfolio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 p-4 bg-secondary/20 rounded-lg">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                    {msg.role === 'ai' && (
                      <img src={mascotImage} alt="AI" className="w-10 h-10 rounded-full flex-shrink-0" />
                    )}
                    <div className={`rounded-lg p-4 max-w-[85%] ${
                      msg.role === 'ai' 
                        ? 'bg-card border border-border text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompts */}
              {user && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={() => setChatInput("What's a good entry point for this stock?")}>
                    Entry point?
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatInput("How does this stock fit my portfolio?")}>
                    Portfolio fit?
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatInput("What are the main risks?")}>
                    Risks?
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatInput("Compare to similar stocks")}>
                    Compare
                  </Button>
                </div>
              )}

              {/* Chat Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder={user ? "Ask about this stock, entry points, risks, or portfolio fit..." : "Sign in to chat with Tradlyte AI"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="min-h-[60px] resize-none"
                  disabled={!user}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!user || !chatInput.trim()} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!user && (
                <p className="text-xs text-muted-foreground mt-2">
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/auth')}>Sign in</Button>
                  {" "}to get personalized AI insights based on your strategy.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Secondary: News, Indicators, Fundamentals (Hidden in Focus Mode) */}
          {!focusMode && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* News */}
              <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  Latest News
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockData.news.map((item, idx) => (
                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
                      <h4 className="font-medium text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Correlated Indicators */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Correlated Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockData.correlatedIndices.map((index) => (
                    <div key={index.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{index.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {index.symbol} · {formatCurrency(index.price)}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${(index.change ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                        {index.change === null ? "N/A" : `${index.change >= 0 ? "+" : ""}${index.change.toFixed(2)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Fundamentals */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Key Fundamentals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Day High</p>
                    <p className="font-semibold text-sm">{formatCurrency(stockData.fundamentals.dayHigh)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Day Low</p>
                    <p className="font-semibold text-sm">{formatCurrency(stockData.fundamentals.dayLow)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="font-semibold text-sm">{formatCurrency(stockData.fundamentals.open)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Market Cap</p>
                    <p className="font-semibold text-sm">{stockData.fundamentals.marketCap}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StockDetail;
