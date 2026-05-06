import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp,
  Target,
  BookOpen,
  Sparkles,
  BarChart3,
  Zap,
  Calendar,
  Trophy,
  Brain,
  Search,
  Layers,
  ArrowRight,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import { isOnboardingCompleteForUser } from '@/lib/purposeUtils';
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
  /** One-day forward return from latest quote (latest-scan view only). */
  return1d: number | null;
  /** Forward return from pick scan date toward ~today using nearest available horizon (historical view). */
  returnSincePick: number | null;
  /** Trading-day horizon used for `returnSincePick` (API bucket nearest to scan→today span). */
  sincePickHorizonDays: number | null;
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

const ALL_SECTORS_SENTINEL = "__all_sectors__";

/** UI labels → exact `symbol_metadata.industry` values for picks filter */
const TOP_PICK_SECTOR_OPTIONS: { label: string; value: string }[] = [
  { label: "All sectors", value: ALL_SECTORS_SENTINEL },
  { label: "Technology", value: "ELECTRONIC COMPUTERS" },
  { label: "Semiconductors", value: "SEMICONDUCTORS & RELATED DEVICES" },
  { label: "Software", value: "SERVICES-PREPACKAGED SOFTWARE" },
  { label: "Banks", value: "NATIONAL COMMERCIAL BANKS" },
  { label: "Pharmaceuticals", value: "PHARMACEUTICAL PREPARATIONS" },
  { label: "Biotech", value: "BIOLOGICAL PRODUCTS, (NO DIAGNOSTIC SUBSTANCES)" },
  { label: "Oil & gas", value: "CRUDE PETROLEUM & NATURAL GAS" },
  { label: "Retail", value: "RETAIL-VARIETY STORES" },
];

const MIN_MARKET_CAP_TIERS: { label: string; apiValue: string }[] = [
  { label: "Any size", apiValue: "" },
  { label: "$1B+", apiValue: "1000000000" },
  { label: "$5B+", apiValue: "5000000000" },
  { label: "$10B+", apiValue: "10000000000" },
  { label: "$50B+", apiValue: "50000000000" },
  { label: "$100B+", apiValue: "100000000000" },
  { label: "$500B+", apiValue: "500000000000" },
];

function strategyLabelFromApi(strategyName: string | null): string {
  if (!strategyName) return "Vegas Channel";
  const s = strategyName.toLowerCase();
  if (s.includes("vegas")) return "Vegas Channel";
  if (s.includes("golden")) return "Golden Cross";
  return strategyName.replace(/_/g, " ");
}

/** Local calendar date YYYY-MM-DD, N calendar days before today (midday anchor avoids DST flips). */
function calendarYmdDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - Math.max(0, Math.floor(daysAgo)));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PICK_SCAN_QUICK_OFFSETS: { label: string; daysAgo: number }[] = [
  { label: "7d ago", daysAgo: 7 },
  { label: "30d ago", daysAgo: 30 },
  { label: "90d ago", daysAgo: 90 },
  { label: "~6 mo", daysAgo: 182 },
];

/** Rough trading days between scan date and today (capped at 252). */
function approxTradingDaysSinceScan(scanYmd: string, end = new Date()): number {
  const scan = new Date(`${scanYmd}T12:00:00Z`);
  const ms = end.getTime() - scan.getTime();
  if (ms <= 0) return 1;
  const calendarDays = ms / 86400000;
  return Math.min(252, Math.max(1, Math.round((calendarDays * 5) / 7)));
}

function parseReturnHorizonKey(k: string): number | null {
  const s = k.trim().toLowerCase();
  const d = /^(\d+)d$/.exec(s);
  if (d) return Number(d[1]);
  const n = /^(\d+)$/.exec(s);
  return n ? Number(n[1]) : null;
}

function buildHorizonsQuery(targetTradingDays: number): string {
  const set = new Set([1, 5, 21, targetTradingDays]);
  if (targetTradingDays > 21) set.add(63);
  if (targetTradingDays > 63) set.add(126);
  if (targetTradingDays > 126) set.add(252);
  return [...set]
    .filter((x) => x >= 1 && x <= 252)
    .sort((a, b) => a - b)
    .join(",");
}

function extractReturnsMap(row: Record<string, unknown>): Record<string, number> | null {
  const raw = row.returns ?? row.forward_returns ?? row.horizon_returns;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length ? out : null;
}

/** Pick API `data` array or `{ picks: [...] }`. */
function normalizePicksReturnsPayload(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((x): x is Record<string, unknown> => x != null && typeof x === "object" && !Array.isArray(x));
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const p = (data as { picks?: unknown }).picks;
    if (Array.isArray(p)) return normalizePicksReturnsPayload(p);
  }
  return [];
}

function pickPriceFromRow(r: Record<string, unknown>): number | null {
  for (const k of ["close", "price", "entry_price", "pick_price", "scan_price"]) {
    const v = r[k];
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickBestHorizonValue(
  returns: Record<string, number>,
  targetTradingDays: number,
): { value: number | null; horizon: number | null } {
  const scored: { h: number; v: number }[] = [];
  for (const [k, v] of Object.entries(returns)) {
    const h = parseReturnHorizonKey(k);
    if (h === null || !Number.isFinite(v)) continue;
    scored.push({ h, v });
  }
  if (scored.length === 0) return { value: null, horizon: null };
  scored.sort((a, b) => {
    const da = Math.abs(a.h - targetTradingDays);
    const db = Math.abs(b.h - targetTradingDays);
    if (da !== db) return da - db;
    return b.h - a.h;
  });
  const best = scored[0];
  return { value: best?.v ?? null, horizon: best?.h ?? null };
}

function getHorizonReturn(returns: Record<string, number>, days: number): number | null {
  const keys = [`${days}`, `${days}d`, `${days}D`];
  for (const k of keys) {
    if (k in returns && Number.isFinite(returns[k])) return returns[k];
  }
  return null;
}

function formatPickReturnCell(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const pct = Math.abs(value) <= 1 ? value * 100 : value;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function pickIndustry(r: Record<string, unknown>): string {
  const top = String(r.industry ?? r.sector ?? "").trim();
  if (top) return top;
  const meta = r.metadata ?? r.symbol_metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const m = meta as Record<string, unknown>;
    return String(m.industry ?? m.sector ?? "").trim();
  }
  return "";
}

function pickMarketCap(r: Record<string, unknown>): number | undefined {
  for (const k of ["market_cap", "marketcap", "market_cap_usd"]) {
    const n = typeof r[k] === "number" ? (r[k] as number) : Number(r[k]);
    if (Number.isFinite(n)) return n;
  }
  const meta = r.metadata ?? r.symbol_metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const m = meta as Record<string, unknown>;
    for (const k of ["market_cap", "marketcap", "market_cap_usd"]) {
      const n = typeof m[k] === "number" ? (m[k] as number) : Number(m[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function rowMatchesSectorCap(
  r: Record<string, unknown>,
  sector: string,
  minCapStr: string,
): boolean {
  if (sector) {
    const ind = pickIndustry(r);
    if (ind !== "" && ind !== sector) return false;
  }
  if (minCapStr) {
    const min = Number(minCapStr);
    if (Number.isFinite(min) && min > 0) {
      const cap = pickMarketCap(r);
      if (cap != null && cap < min) return false;
    }
  }
  return true;
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
  const [pickSectorValue, setPickSectorValue] = useState(ALL_SECTORS_SENTINEL);
  const [pickMinCapTierIndex, setPickMinCapTierIndex] = useState(0);
  const [pickQuery, setPickQuery] = useState({ sector: "", minCap: "" });
  /** Empty string → latest scan (`/picks/today`); YYYY-MM-DD → `/picks/{date}/returns` */
  const [pickScanDate, setPickScanDate] = useState("");
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
    } else if (!loading && user && !isOnboardingCompleteForUser(user)) {
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
    const t = window.setTimeout(() => {
      const sectorRaw = pickSectorValue.trim();
      setPickQuery({
        sector: sectorRaw === ALL_SECTORS_SENTINEL ? "" : sectorRaw,
        minCap: MIN_MARKET_CAP_TIERS[pickMinCapTierIndex]?.apiValue ?? "",
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [pickSectorValue, pickMinCapTierIndex]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTopPicks = async () => {
      setTopPicksLoading(true);
      try {
        const headers: HeadersInit = {};
        if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

        const scanYmd = pickScanDate.trim();

        if (scanYmd) {
          const targetTd = approxTradingDaysSinceScan(scanYmd);
          const horizons = buildHorizonsQuery(targetTd);
          const url = new URL(`${MARKET_API_BASE_URL}/picks/${encodeURIComponent(scanYmd)}/returns`);
          url.searchParams.set("horizons", horizons);
          if (pickQuery.sector) url.searchParams.set("industry", pickQuery.sector);
          if (pickQuery.minCap) url.searchParams.set("min_market_cap", pickQuery.minCap);

          const res = await fetch(url.toString(), {
            headers,
            signal: controller.signal,
          });
          if (!res.ok) {
            toast.error(`Could not load picks / returns for ${scanYmd} (${res.status}).`);
            setTopPicks([]);
            return;
          }
          const body = (await res.json()) as { data?: unknown };
          let rawRows = normalizePicksReturnsPayload(body.data);
          rawRows = rawRows.filter((r) =>
            String(r.strategy_name ?? "").toLowerCase().includes("vegas_channel"),
          );
          // Keep a light client-side filter for shape differences (metadata nested vs flat).
          rawRows = rawRows.filter((r) => rowMatchesSectorCap(r, pickQuery.sector, pickQuery.minCap));
          rawRows.sort(
            (a, b) => Number(a.rank ?? Number.MAX_SAFE_INTEGER) - Number(b.rank ?? Number.MAX_SAFE_INTEGER),
          );

          const mapped: TopPickRow[] = rawRows.slice(0, 10).map((r) => {
            const symbol = String(r.symbol ?? "").trim();
            const retMap = extractReturnsMap(r) ?? {};
            const { value, horizon } = pickBestHorizonValue(retMap, targetTd);
            const rankRaw = r.rank;
            const rank =
              typeof rankRaw === "number"
                ? rankRaw
                : typeof rankRaw === "string" && rankRaw.trim() !== ""
                  ? Number(rankRaw)
                  : null;
            return {
              symbol,
              strategyName: strategyLabelFromApi((r.strategy_name as string | null) ?? null),
              close: pickPriceFromRow(r),
              return1d: getHorizonReturn(retMap, 1),
              returnSincePick: value,
              sincePickHorizonDays: horizon,
              rank: Number.isFinite(rank as number) ? (rank as number) : null,
            };
          });
          setTopPicks(mapped);
          return;
        }

        const url = new URL(`${MARKET_API_BASE_URL}/picks/today`);
        url.searchParams.set("limit", "200");
        if (pickQuery.sector) url.searchParams.set("industry", pickQuery.sector);
        if (pickQuery.minCap) url.searchParams.set("min_market_cap", pickQuery.minCap);

        const picksRes = await fetch(url.toString(), {
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
                  strategyName: strategyLabelFromApi(pick.strategy_name ?? null),
                  close: Number.isFinite(fallbackPrice) ? fallbackPrice : null,
                  return1d: null,
                  returnSincePick: null,
                  sincePickHorizonDays: null,
                  rank: pick.rank,
                } satisfies TopPickRow;
              }

              const returnsJson = (await returnsRes.json()) as MarketReturnsResponse;
              const return1d = Number(returnsJson.data?.returns?.["1d"]);

              return {
                symbol: pick.symbol,
                strategyName: strategyLabelFromApi(pick.strategy_name ?? null),
                close: Number.isFinite(fallbackPrice) ? fallbackPrice : null,
                return1d: Number.isFinite(return1d) ? return1d : null,
                returnSincePick: null,
                sincePickHorizonDays: null,
                rank: pick.rank,
              } satisfies TopPickRow;
            } catch {
              return {
                symbol: pick.symbol,
                strategyName: strategyLabelFromApi(pick.strategy_name ?? null),
                close: Number.isFinite(fallbackPrice) ? fallbackPrice : null,
                return1d: null,
                returnSincePick: null,
                sincePickHorizonDays: null,
                rank: pick.rank,
              } satisfies TopPickRow;
            }
          })
        );

        setTopPicks(rows);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching Vegas Channel picks:", error);
      } finally {
        setTopPicksLoading(false);
      }
    };

    fetchTopPicks();
    return () => controller.abort();
  }, [pickQuery, pickScanDate]);

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
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto px-4 max-w-7xl space-y-8 md:space-y-10">
          {/* —— 1 · Hero: Top picks (main focal area, spacious) —— */}
          <section
            className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-accent/[0.06] shadow-[0_24px_80px_-24px_hsl(var(--primary)/0.25)]"
            aria-labelledby="dashboard-top-picks-heading"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 md:px-10 md:pt-12 md:pb-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                <div className="max-w-2xl space-y-3">
                  <Badge className="w-fit border-0 bg-primary/15 text-primary hover:bg-primary/15">
                    <Layers className="mr-1.5 h-3.5 w-3.5" />
                    Vegas Channel
                  </Badge>
                  <h2
                    id="dashboard-top-picks-heading"
                    className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
                  >
                    {pickScanDate.trim() ? "Historical scan picks" : "Today's top picks"}
                  </h2>
                  <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                    {pickScanDate.trim() ? (
                      <>
                        Forward returns from{" "}
                        <span className="font-medium text-foreground">{pickScanDate.trim()}</span> toward now using the
                        nearest horizon the API reports. Open any symbol for the full story.
                      </>
                    ) : (
                      <>
                        Curated ranked ideas from the latest run. Give each pick room to breathe — tap through when
                        something stands out.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Filters: pill panel, not cramped */}
              <div className="mt-8 rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur-sm sm:p-5 md:p-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="space-y-3 min-w-0 flex-1">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Scan date
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        className="h-11 text-sm bg-background w-[12rem] rounded-xl border-border/60"
                        max={new Date().toISOString().slice(0, 10)}
                        min="2020-01-01"
                        value={pickScanDate}
                        onChange={(e) => setPickScanDate(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant={pickScanDate.trim() ? "secondary" : "default"}
                        size="sm"
                        className="h-11 rounded-xl"
                        onClick={() => setPickScanDate("")}
                      >
                        Latest run
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PICK_SCAN_QUICK_OFFSETS.map(({ label, daysAgo }) => (
                        <Button
                          key={label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`h-9 rounded-full px-4 text-xs ${
                            pickScanDate === calendarYmdDaysAgo(daysAgo)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60"
                          }`}
                          onClick={() => setPickScanDate(calendarYmdDaysAgo(daysAgo))}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Empty uses the newest picks. Older dates compare how that day&apos;s list performed since.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap xl:flex-nowrap xl:items-end xl:justify-end xl:gap-6">
                    <div className="space-y-2 sm:w-[13rem]">
                      <Label className="text-xs font-medium text-muted-foreground">Sector</Label>
                      <Select value={pickSectorValue} onValueChange={setPickSectorValue}>
                        <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                          <SelectValue placeholder="Sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOP_PICK_SECTOR_OPTIONS.map((o) => (
                            <SelectItem key={o.label} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 flex-1 min-w-[180px] max-w-md">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-medium text-muted-foreground">Minimum market cap</Label>
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {MIN_MARKET_CAP_TIERS[pickMinCapTierIndex]?.label ?? "Any size"}
                        </span>
                      </div>
                      <Slider
                        value={[pickMinCapTierIndex]}
                        min={0}
                        max={MIN_MARKET_CAP_TIERS.length - 1}
                        step={1}
                        onValueChange={(v) => setPickMinCapTierIndex(v[0] ?? 0)}
                        className="py-2"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 rounded-xl shrink-0 border-border/60"
                      onClick={() => {
                        setPickSectorValue(ALL_SECTORS_SENTINEL);
                        setPickMinCapTierIndex(0);
                        setPickScanDate("");
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pick grid: fewer columns on large screens = larger tiles */}
              <div className="mt-8 md:mt-10">
                {topPicksLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={`top-pick-skeleton-${idx}`}
                        className="rounded-2xl border border-border/30 bg-muted/20 p-5 min-h-[140px] animate-pulse"
                      >
                        <div className="h-4 w-16 bg-muted rounded-lg mb-4" />
                        <div className="h-8 w-24 bg-muted rounded-lg mb-2" />
                        <div className="h-5 w-full bg-muted/80 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
                    {topPicks.map((pick) => {
                      const historical = Boolean(pickScanDate.trim());
                      const mainR = historical ? pick.returnSincePick : pick.return1d;
                      const up =
                        mainR != null && (Math.abs(mainR) <= 1 ? mainR >= 0 : mainR >= 0);
                      return (
                        <button
                          key={`${pick.symbol}-${pick.rank ?? ""}`}
                          type="button"
                          onClick={() => navigate(`/stock/${pick.symbol}`)}
                          className={[
                            "group rounded-2xl border text-left transition-all duration-300",
                            "border-border/50 bg-card/80 hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-lg hover:shadow-primary/5",
                            "p-5 md:p-6 min-h-[150px] flex flex-col justify-between",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {pick.strategyName}
                              </span>
                              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                <span className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                  {pick.symbol}
                                </span>
                                <span className="rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                                  Rank {pick.rank ?? "—"}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
                          </div>
                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 pt-4 border-t border-border/40">
                            <div>
                              <span className="text-xs text-muted-foreground">Quote</span>
                              <div className="font-mono text-lg font-semibold tabular-nums">
                                {pick.close !== null ? `$${pick.close.toFixed(2)}` : "—"}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground">
                                {historical ? "~since scan" : "1 session"}
                              </span>
                              <div
                                className={`flex items-center justify-end gap-1 text-lg font-bold tabular-nums ${
                                  mainR != null ? (up ? "text-primary" : "text-destructive") : "text-muted-foreground"
                                }`}
                              >
                                {mainR != null && up ? (
                                  <TrendingUp className="h-4 w-4 shrink-0" />
                                ) : mainR != null ? (
                                  <TrendingDown className="h-4 w-4 shrink-0" />
                                ) : null}
                                {historical ? formatPickReturnCell(pick.returnSincePick) : formatPickReturnCell(pick.return1d)}
                              </div>
                              {historical ? (
                                <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                                  ~{pick.sincePickHorizonDays ?? "—"} td · 1d: {formatPickReturnCell(pick.return1d)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {!topPicksLoading && topPicks.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-4 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
                    {pickScanDate.trim()
                      ? `No Vegas Channel picks for ${pickScanDate.trim()} with these filters, or returns came back empty.`
                      : "No picks match — try widening sector or lowering minimum market cap."}
                  </p>
                )}
              </div>
            </div>
          </section>

          <WisdomQuoteBanner />

          <div className="flex justify-end">
            <FocusModeToggle />
          </div>

          {/* —— 2 · Performance & discovery: indices + symbol search + growth + chart —— */}
          <section
            className="rounded-3xl border border-border/40 bg-gradient-to-b from-muted/20 via-background to-background shadow-card overflow-hidden"
            aria-labelledby="dashboard-growth-heading"
          >
            {!focusMode && (
              <div className="border-b border-border/40 bg-muted/15 px-4 py-4 sm:px-6 md:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Markets at a glance
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {marketIndicators.map((indicator) => (
                    <div
                      key={indicator.symbol}
                      className="flex min-w-[7.5rem] shrink-0 flex-col rounded-xl border border-border/35 bg-background/80 px-3 py-3 text-center shadow-sm transition-colors hover:border-primary/25"
                    >
                      <span className="text-[11px] text-muted-foreground leading-tight">{indicator.name}</span>
                      <span className="mt-1 font-mono text-sm font-semibold">{indicator.value}</span>
                      <Badge
                        variant="secondary"
                        className={`mt-1 justify-center text-[10px] border-0 ${
                          indicator.positive
                            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-500/12 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {indicator.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-border/40 px-5 py-8 sm:px-8 md:px-10 bg-gradient-to-r from-primary/[0.04] via-transparent to-accent/[0.04]">
              <div className="mx-auto max-w-3xl text-center mb-6">
                <h2 id="dashboard-growth-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  Explore &amp; track growth
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Search any symbol, then review your entry-based growth and longer-term chart in one place.
                </p>
              </div>
              <form onSubmit={handleSearch} className="relative mx-auto max-w-3xl">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                  <Input
                    type="text"
                    placeholder="Symbol (e.g. AAPL, TSLA, NVDA)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 md:h-16 pl-14 pr-32 text-base md:text-lg bg-background border-2 border-border/70 hover:border-primary/35 focus:border-primary rounded-2xl shadow-md"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10 md:h-11 px-5 shadow-md"
                  >
                    Analyze
                    <TrendingUp className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                <span className="text-xs text-muted-foreground self-center mr-1">Popular</span>
                {["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL"].map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/stock/${symbol}`);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-background/80 border border-border/50 hover:border-primary/40 hover:bg-primary/8 text-foreground transition-all"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <EntryPriceGrowth />
                {!focusMode && <GrowthChart />}
              </div>
            </div>
          </section>

          {shouldShowPrompt && cooldownEnabled && (
            <CooldownPrompt onEnable={enableCooldown} onDismiss={() => {}} />
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

          {/* —— 3 · Intent & habits: goals, journal, purpose in one cohesive band —— */}
          <section
            className="rounded-3xl border border-border/45 bg-muted/15 overflow-hidden shadow-card"
            aria-labelledby="dashboard-intent-heading"
          >
            <div className="border-b border-border/40 px-6 py-5 sm:px-8 md:px-10 bg-gradient-to-r from-background via-primary/[0.03] to-background">
              <h2 id="dashboard-intent-heading" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Goals, reflections &amp; purpose
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                One place for where you&apos;re headed, how you&apos;re feeling in the journal, and the &quot;why&quot;
                behind your trades.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x lg:divide-border/40">
              {/* Goals */}
              <div className="p-6 sm:p-8 flex flex-col min-h-[280px] lg:min-h-0">
                <div className="flex items-start justify-between gap-2 mb-5">
                  <div className="flex items-center gap-2 font-display text-lg font-semibold">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <Target className="h-4 w-4" />
                    </div>
                    Goal progress
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    <Trophy className="w-3 h-3 mr-1" />
                    {goals.length} active
                  </Badge>
                </div>
                <div className="space-y-4 flex-1">
                  {goals.length > 0 ? (
                    goals.slice(0, 2).map((goal) => (
                      <div key={goal.id} className="space-y-2 rounded-xl border border-border/35 bg-background/60 p-4">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-foreground line-clamp-2">{goal.title}</span>
                          <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                            ${goal.current_amount ? parseFloat(goal.current_amount.toString()).toLocaleString() : "0"}{" "}
                            / ${goal.target_amount ? parseFloat(goal.target_amount.toString()).toLocaleString() : "0"}
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-2 rounded-full" />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/55 bg-muted/20 py-10 text-center px-4">
                      <p className="text-sm text-muted-foreground mb-4">No goals yet — set one to anchor decisions.</p>
                      <Link to="/goals">
                        <Button size="sm" variant="outline">
                          <Target className="h-4 w-4 mr-2" />
                          Create goal
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/goals" className="mt-5 block">
                  <Button variant="ghost" size="sm" className="w-full rounded-xl text-muted-foreground hover:text-primary">
                    View all goals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Journal */}
              <div className="p-6 sm:p-8 flex flex-col min-h-[280px] lg:min-h-0 border-t border-border/40 lg:border-t-0">
                <div className="flex items-start justify-between gap-2 mb-5">
                  <div className="flex items-center gap-2 font-display text-lg font-semibold">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    Journal insights
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 bg-accent/10 border-accent/25 text-accent">
                    <Calendar className="w-3 h-3 mr-1" />
                    {journalStats.weekStreak} wk streak
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6 flex-1 content-start">
                  <div className="rounded-xl border border-border/35 bg-background/60 p-4 text-center">
                    <div className="text-2xl font-bold text-foreground tabular-nums">{journalStats.totalEntries}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Entries</div>
                  </div>
                  <div className="rounded-xl border border-border/35 bg-background/60 p-4 text-center">
                    <div className="text-lg font-semibold text-accent">{journalStats.avgMood}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Mood</div>
                  </div>
                </div>
                <Link to="/journal">
                  <Button variant="outline" size="sm" className="w-full rounded-xl">
                    <Brain className="h-4 w-4 mr-2" />
                    Open journal
                    <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
                  </Button>
                </Link>
              </div>

              {/* Purpose */}
              <div className="p-6 sm:p-8 flex flex-col min-h-0 lg:min-h-0 bg-gradient-to-b from-background/80 to-primary/[0.04] border-t border-border/40 lg:border-t-0">
                <div className="flex items-center gap-2 font-display text-lg font-semibold mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  Your purpose
                </div>
                <div className="flex-1 min-h-[120px]">
                  <PurposeReminder />
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;
