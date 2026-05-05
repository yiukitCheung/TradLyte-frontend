import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, AlertCircle, Layers, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
/** Matches StrategyBuilder `Condition` shape without importing the page (avoids circular dependency). */
export interface ChartStrategyCondition {
  id: string;
  type: string;
  label: string;
  category: "entry" | "exit";
}

export interface StrategySummary {
  title: string;
  description: string;
}

export interface BacktestResultShape {
  total_return_pct?: number;
  sharpe_ratio?: number;
  max_drawdown_pct?: number;
  equity_curve?: number[];
  total_trades?: number;
  win_rate?: number;
}

interface PerformanceChartProps {
  mode: "prebuilt" | "custom";
  /** Prebuilt strategy card is selected */
  prebuiltStrategySelected: boolean;
  /** Custom tab: legacy fake simulation pulse */
  isSimulating: boolean;
  /** Prebuilt POST /backtest in flight */
  isBacktesting: boolean;
  conditions: ChartStrategyCondition[];
  strategySummary?: StrategySummary | null;
  backtestSymbol: string;
  backtestResult: BacktestResultShape | null;
  backtestMeta?: Record<string, unknown> | null;
}

function formatPctLike(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const pct = abs <= 1 ? v * 100 : v;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function formatWinRate(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  if (v >= 0 && v <= 1) return `${(v * 100).toFixed(1)}%`;
  return `${v.toFixed(1)}%`;
}

const stockOptions = [
  { value: "all", label: "All Stocks (General)", baseReturn: 8 },
  { value: "aapl", label: "AAPL - Apple Inc.", baseReturn: 12 },
  { value: "googl", label: "GOOGL - Alphabet", baseReturn: 10 },
  { value: "msft", label: "MSFT - Microsoft", baseReturn: 11 },
  { value: "tsla", label: "TSLA - Tesla", baseReturn: 15 },
  { value: "amzn", label: "AMZN - Amazon", baseReturn: 9 },
  { value: "nvda", label: "NVDA - NVIDIA", baseReturn: 18 },
];

const calculateStrategyMultiplier = (conditions: ChartStrategyCondition[]): number => {
  if (conditions.length === 0) return 1;

  let multiplier = 1;
  conditions.forEach((condition) => {
    switch (condition.type) {
      case "moving_average":
        multiplier += 0.15;
        break;
      case "rsi":
        multiplier += 0.18;
        break;
      case "volume":
        multiplier += 0.12;
        break;
      case "macd":
        multiplier += 0.2;
        break;
      case "bollinger":
        multiplier += 0.22;
        break;
      case "fibonacci":
        multiplier += 0.25;
        break;
      case "price_action":
        multiplier += 0.1;
        break;
      case "momentum":
        multiplier += 0.16;
        break;
      case "support_resistance":
        multiplier += 0.14;
        break;
      default:
        multiplier += 0.1;
    }
  });

  if (conditions.length > 3) {
    multiplier *= 0.9;
  }

  return Math.min(multiplier, 2.5);
};

const generateChartData = (stockBaseReturn: number, strategyMultiplier: number) => {
  const data: Array<{ month: string; market: number; strategy: number; event?: string }> = [];
  const events = [
    { month: 6, label: "Fed Rate Hike", impact: -5 },
    { month: 14, label: "Earnings Beat", impact: 8 },
    { month: 22, label: "Market Correction", impact: -12 },
    { month: 28, label: "Recovery Rally", impact: 10 },
  ];

  let marketValue = 100;
  let strategyValue = 100;
  const volatility = stockBaseReturn / 10;
  const startDate = new Date(2022, 0);

  for (let i = 0; i < 36; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const event = events.find((e) => e.month === i);
    const randomFactor = (Math.random() - 0.48) * volatility;
    const marketChange = event ? event.impact : randomFactor;
    const strategyChange = event ? event.impact * (0.5 + strategyMultiplier * 0.2) : randomFactor * strategyMultiplier;

    marketValue += marketChange;
    strategyValue += strategyChange;

    data.push({
      month: label,
      market: Math.round(marketValue * 10) / 10,
      strategy: Math.round(strategyValue * 10) / 10,
      event: event?.label,
    });
  }

  return data;
};

const calculateSharpeRatio = (chartData: { market: number; strategy: number }[], riskFreePerAnnum = 0.02) => {
  if (chartData.length < 2) return 0;
  const monthlyRf = riskFreePerAnnum / 12;
  const returns: number[] = [];
  for (let i = 1; i < chartData.length; i++) {
    const prev = chartData[i - 1].strategy;
    const curr = chartData[i].strategy;
    returns.push((curr - prev) / prev);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length;
  const vol = Math.sqrt(variance) || 0.001;
  const excessReturn = avgReturn - monthlyRf;
  const sharpeMonthly = vol ? excessReturn / vol : 0;
  return Math.round(sharpeMonthly * Math.sqrt(12) * 100) / 100;
};

const chartConfig = {
  market: {
    label: "Market Index",
    color: "hsl(var(--muted-foreground))",
  },
  strategy: {
    label: "Your Strategy",
    color: "hsl(var(--primary))",
  },
  equity: {
    label: "Backtest equity",
    color: "hsl(var(--primary))",
  },
};

const PerformanceChart = ({
  mode,
  prebuiltStrategySelected,
  isSimulating,
  isBacktesting,
  conditions,
  strategySummary,
  backtestSymbol,
  backtestResult,
  backtestMeta,
}: PerformanceChartProps) => {
  const [selectedStock, setSelectedStock] = useState("all");
  const [chartKey, setChartKey] = useState(0);

  const stock = stockOptions.find((s) => s.value === selectedStock) || stockOptions[0];
  const strategyMultiplier = calculateStrategyMultiplier(conditions);

  const chartData = useMemo(() => {
    return generateChartData(stock.baseReturn, strategyMultiplier);
  }, [stock.baseReturn, strategyMultiplier, chartKey]);

  useEffect(() => {
    if (conditions.length > 0) {
      setChartKey((prev) => prev + 1);
    }
  }, [conditions.length]);

  const finalMarket = chartData[chartData.length - 1]?.market ?? 0;
  const finalStrategy = chartData[chartData.length - 1]?.strategy ?? 0;
  const outperformance =
    finalMarket !== 0 ? (((finalStrategy - finalMarket) / finalMarket) * 100).toFixed(1) : "0";
  const sharpeRatio = useMemo(() => calculateSharpeRatio(chartData), [chartData]);

  const hasCustomConditions = conditions.length > 0;

  const realChartData = useMemo(() => {
    const curve = backtestResult?.equity_curve;
    if (!curve?.length) return [];
    return curve.map((v, i) => ({
      bar: String(i + 1),
      equity: typeof v === "number" && Number.isFinite(v) ? v : Number(v),
    }));
  }, [backtestResult]);

  const hasRealBacktest = mode === "prebuilt" && realChartData.length > 0;

  const prebuiltEmptyMessage = !prebuiltStrategySelected
    ? "Select a prebuilt strategy above, enter a symbol and date range, then run simulation."
    : !backtestSymbol.trim()
      ? "Enter a stock symbol to backtest."
      : "Click Run simulation to load results from the serving API.";

  return (
    <Card className="shadow-card border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <TrendingUp className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl lg:text-3xl font-display">Performance analysis</CardTitle>
              <CardDescription className="text-base">
                {mode === "prebuilt"
                  ? "Numbers from your latest run above — equity curve plus risk and trade stats."
                  : "Rough preview from your chosen rules — for layout only, not a live backtest."}
              </CardDescription>
            </div>
          </div>

          {strategySummary && (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Layers className="h-4 w-4" />
                  Strategy
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="left" align="start" className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    {strategySummary.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-snug">{strategySummary.description}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {mode === "custom" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Benchmark style:</label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Backtest symbol</span>
                <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                  {backtestSymbol.trim() || "—"}
                </Badge>
              </div>
            )}

            {mode === "custom" &&
              hasCustomConditions &&
              (parseFloat(outperformance) > 0 ? (
                <Badge className="bg-gradient-primary text-lg px-4 py-2 shadow-glow">
                  <TrendingUp className="h-4 w-4 mr-2" />+{outperformance}% vs Market
                </Badge>
              ) : (
                <Badge variant="outline" className="border-destructive text-destructive text-lg px-4 py-2">
                  <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                  {outperformance}% vs Market
                </Badge>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "prebuilt" ? (
          <>
            {!prebuiltStrategySelected || !hasRealBacktest ? (
              <div className="relative min-h-[350px] flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-primary/30">
                {isBacktesting && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Running backtest…
                    </div>
                  </div>
                )}
                <div className="text-center p-8 max-w-lg">
                  <div className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">{prebuiltEmptyMessage}</p>
                  {prebuiltStrategySelected && backtestSymbol.trim() && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      Serving API equity curve and risk metrics render here after each run.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={realChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="bar" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(v) => `$${typeof v === "number" ? v.toLocaleString() : v}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        name="Equity"
                        stroke={chartConfig.equity.color}
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">Total return</p>
                    <p className="text-2xl font-bold text-foreground">{formatPctLike(backtestResult?.total_return_pct)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">Max drawdown</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatPctLike(backtestResult?.max_drawdown_pct)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground">Sharpe</p>
                    <p className="text-2xl font-bold text-primary">
                      {backtestResult?.sharpe_ratio != null ? backtestResult.sharpe_ratio.toFixed(4) : "—"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-2xl font-bold text-foreground">{backtestResult?.total_trades ?? "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">Win rate</p>
                    <p className="text-2xl font-bold text-foreground">{formatWinRate(backtestResult?.win_rate)}</p>
                  </div>
                </div>

                {backtestMeta && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {String(backtestMeta.symbol ?? backtestSymbol)} · {String(backtestMeta.timeframe ?? "")} ·{" "}
                    {String(backtestMeta.start_date ?? "")} → {String(backtestMeta.end_date ?? "")}
                  </p>
                )}
              </>
            )}
          </>
        ) : !hasCustomConditions ? (
          <div className="h-[350px] flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-primary/30">
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xl font-semibold text-foreground">Add conditions to see illustrative performance</p>
              <p className="text-muted-foreground mt-2 max-w-md">
                Prebuilt strategies use the live API; custom mode stays a sandbox projection for layout experiments.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {chartData.map((point, index) =>
                    point.event ? (
                      <ReferenceLine
                        key={index}
                        x={point.month}
                        stroke="hsl(var(--accent))"
                        strokeDasharray="3 3"
                        label={{
                          value: point.event,
                          position: "top",
                          fill: "hsl(var(--accent))",
                          fontSize: 10,
                        }}
                      />
                    ) : null
                  )}
                  <Line
                    type="monotone"
                    dataKey="market"
                    stroke={chartConfig.market.color}
                    strokeWidth={2}
                    dot={false}
                    opacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="strategy"
                    stroke={chartConfig.strategy.color}
                    strokeWidth={4}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Market Final Value</p>
                <p className="text-2xl font-bold text-foreground">${finalMarket}</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">Strategy Final Value</p>
                <p className="text-2xl font-bold text-primary">${finalStrategy}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-foreground">{sharpeRatio}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Active Conditions</p>
                <p className="text-2xl font-bold text-foreground">{conditions.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Strategy Multiplier</p>
                <p className="text-2xl font-bold text-foreground">{strategyMultiplier.toFixed(2)}x</p>
              </div>
            </div>
          </>
        )}

        {mode === "custom" && hasCustomConditions && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Market Events:</span> Illustrative only — not from your
                serving API.
              </div>
            </div>
          </div>
        )}

        {isSimulating && mode === "custom" && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
            <p className="text-sm text-primary font-medium text-center">Updating illustrative projection…</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
