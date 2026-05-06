import { useMemo, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, Layers, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export interface StrategySummary {
  title: string;
  description: string;
}

export interface BacktestResultShape {
  total_return_pct?: number;
  sharpe_ratio?: number;
  max_drawdown_pct?: number;
  equity_curve?: number[];
  /** Optional parallel timeline for each equity point (ISO or YYYY-MM-DD). */
  equity_curve_dates?: string[];
  total_trades?: number;
  win_rate?: number;
  final_capital?: number;
  first_trade?: Record<string, unknown>;
  last_trade?: Record<string, unknown>;
  /** Full trade log from `trades` in the backtest response (same shape as API). */
  trades?: Record<string, unknown>[];
}

interface PerformanceChartProps {
  mode: "prebuilt" | "custom";
  /** Prebuilt strategy card is selected */
  prebuiltStrategySelected: boolean;
  /** Prebuilt POST /backtest in flight */
  isBacktesting: boolean;
  strategySummary?: StrategySummary | null;
  backtestSymbol: string;
  backtestResult: BacktestResultShape | null;
  backtestMeta?: Record<string, unknown> | null;
  /** Optional benchmark curve aligned to equity points (e.g., SPY). */
  benchmarkCurve?: number[] | null;
  benchmarkLabel?: string;
  prebuiltControls?: ReactNode;
  customControls?: ReactNode;
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

/** Parse leading YYYY-MM-DD as UTC midnight for stable chart spacing. */
function utcMsFromYmd(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(ymd).trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(t) ? t : null;
}

function parseEquityDate(s: string): number | null {
  const asYmd = utcMsFromYmd(s);
  if (asYmd != null) return asYmd;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

/** Inclusive span [start, end] mapped to n samples (evenly spaced in time). */
function interpolateEquityTimestamps(n: number, startMs: number, endMs: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [startMs];
  const span = Math.max(endMs - startMs, 0);
  return Array.from({ length: n }, (_, i) => startMs + (span * i) / (n - 1));
}

function metaDateRangeMs(meta: Record<string, unknown> | null | undefined): { startMs: number; endMs: number } | null {
  if (!meta) return null;
  const s = meta.start_date ?? meta.startDate;
  const e = meta.end_date ?? meta.endDate;
  const startMs = typeof s === "string" ? utcMsFromYmd(s) : null;
  const endMs = typeof e === "string" ? utcMsFromYmd(e) : null;
  if (startMs == null || endMs == null) return null;
  if (endMs < startMs) return null;
  return { startMs, endMs };
}

const TRADE_COLUMN_ORDER = [
  "entry_date",
  "exit_date",
  "entry_price",
  "exit_price",
  "pnl",
  "pnl_pct",
  "holding_days",
  "exit_reason",
] as const;

function humanizeTradeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format a single cell for the trade log (handles fractional % vs dollars). */
function formatTradeCell(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number" && Number.isFinite(val)) {
    const lk = key.toLowerCase();
    if (lk.includes("pct") || lk.includes("percent") || lk.endsWith("_rate")) {
      return formatPctLike(val);
    }
    if (lk.includes("price") || lk === "pnl" || lk.includes("capital") || lk.includes("amount")) {
      return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return String(val);
  }
  if (typeof val === "string") {
    const n = Number(val);
    if (Number.isFinite(n) && val.trim() !== "") {
      return formatTradeCell(key, n);
    }
    return val;
  }
  return String(val);
}

function collectTradeTableColumns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const fixed of TRADE_COLUMN_ORDER) {
    const hit = rows.some((r) => fixed in r);
    if (hit) {
      ordered.push(fixed);
      seen.add(fixed);
    }
  }
  const rest = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) rest.add(k);
    }
  }
  [...rest].sort().forEach((k) => ordered.push(k));
  return ordered;
}

function formatEquityAxisDate(ms: number, spanDays: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    ...(spanDays > 150 ? { year: "2-digit" } : { day: "numeric" }),
  });
}

const chartConfig = {
  equity: {
    label: "Backtest equity",
    color: "hsl(var(--primary))",
  },
  benchmark: {
    label: "S&P 500 (SPY)",
    color: "hsl(var(--muted-foreground))",
  },
};

const PerformanceChart = ({
  mode,
  prebuiltStrategySelected,
  isBacktesting,
  strategySummary,
  backtestSymbol,
  backtestResult,
  backtestMeta,
  benchmarkCurve,
  benchmarkLabel,
  prebuiltControls,
  customControls,
}: PerformanceChartProps) => {
  const realChartData = useMemo(() => {
    const curve = backtestResult?.equity_curve;
    if (!curve?.length) return [];
    const n = curve.length;
    const explicit = backtestResult.equity_curve_dates;
    let timestamps: number[] | null = null;
    if (Array.isArray(explicit) && explicit.length === n) {
      const parsed = explicit.map((d) => (typeof d === "string" ? parseEquityDate(d) : null));
      if (parsed.every((t): t is number => t != null)) timestamps = parsed;
    }
    if (timestamps == null) {
      const range = metaDateRangeMs(backtestMeta);
      if (range) timestamps = interpolateEquityTimestamps(n, range.startMs, range.endMs);
    }
    const spanDays =
      timestamps && timestamps.length >= 2
        ? Math.max(1, (timestamps[timestamps.length - 1]! - timestamps[0]!) / 86400000)
        : 0;
    return curve.map((v, i) => {
      const equity = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
      const ts = timestamps?.[i];
      const dateLabel =
        ts != null ? formatEquityAxisDate(ts, spanDays) : String(i + 1);
      const bmk =
        Array.isArray(benchmarkCurve) && benchmarkCurve.length === n
          ? benchmarkCurve[i]
          : undefined;
      return { dateLabel, dateMs: ts ?? i, equity, benchmark: bmk };
    });
  }, [backtestResult, backtestMeta, benchmarkCurve]);

  const hasLiveBacktestMetrics =
    !!backtestResult &&
    (backtestResult.total_return_pct != null ||
      backtestResult.final_capital != null ||
      backtestResult.total_trades != null ||
      backtestResult.sharpe_ratio != null);

  const hasEquityCurve = realChartData.length > 0;

  const tradeLogRows = backtestResult?.trades;
  const tradeTableColumns = useMemo(() => {
    if (!tradeLogRows?.length) return [];
    return collectTradeTableColumns(tradeLogRows);
  }, [tradeLogRows]);

  const prebuiltEmptyMessage = !prebuiltStrategySelected
    ? "Select a prebuilt strategy above, enter a symbol and date range, then run simulation."
    : !backtestSymbol.trim()
      ? "Enter a stock symbol to backtest."
      : "Click Run to load results below.";

  const customEmptyMessage = !backtestSymbol.trim()
    ? "Enter a symbol and dates in the workspace above."
    : "Configure setup, trigger, and exit, then run — results appear here.";

  const showPrebuiltPlaceholder =
    mode === "prebuilt" && (!prebuiltStrategySelected || (!hasLiveBacktestMetrics && !isBacktesting));

  const showCustomPlaceholder =
    mode === "custom" && (!hasLiveBacktestMetrics && !isBacktesting);

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
                Live `/backtest` results for this tab — equity curve, SPY comparison when available, and trade stats from
                the API.
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
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Backtest symbol</span>
              <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                {backtestSymbol.trim() || "—"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "prebuilt" && prebuiltControls && <div className="mb-5">{prebuiltControls}</div>}
        {mode === "custom" && customControls && <div className="mb-5">{customControls}</div>}

        {isBacktesting && (
          <div className="flex items-center gap-2 text-sm text-primary mb-4">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Running backtest…
          </div>
        )}

        {showPrebuiltPlaceholder ? (
          <div className="relative min-h-[280px] flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-primary/30">
            <div className="text-center p-8 max-w-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">{prebuiltEmptyMessage}</p>
              {prebuiltStrategySelected && backtestSymbol.trim() && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Configure above, then run once — results appear here.
                </p>
              )}
            </div>
          </div>
        ) : showCustomPlaceholder ? (
          <div className="relative min-h-[280px] flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-primary/30">
            <div className="text-center p-8 max-w-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">{customEmptyMessage}</p>
              <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
                Change one layer at a time (setup / trigger / exit) between runs so experiments stay comparable — and rename{" "}
                <span className="font-mono">strategy_name</span> often so payloads stay identifiable.
              </p>
            </div>
          </div>
        ) : null}

        {hasLiveBacktestMetrics && (
              <>
                {hasEquityCurve ? (
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="dateLabel"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          interval="preserveStartEnd"
                          minTickGap={28}
                          angle={-25}
                          textAnchor="end"
                          height={52}
                        />
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
                        <Line
                          type="monotone"
                          dataKey="benchmark"
                          name={benchmarkLabel ?? chartConfig.benchmark.label}
                          stroke={chartConfig.benchmark.color}
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          dot={false}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground mb-6">
                    No equity series in this response — showing summary metrics only.
                  </div>
                )}

                <div
                  className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 ${hasEquityCurve ? "mt-6" : ""}`}
                >
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
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">Ending capital</p>
                    <p className="text-2xl font-bold text-foreground">
                      {backtestResult?.final_capital != null
                        ? `$${backtestResult.final_capital.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {tradeLogRows && tradeLogRows.length > 0 && tradeTableColumns.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm font-medium text-foreground">Trade log</p>
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                      <div className="max-h-[min(28rem,55vh)] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                            <TableRow>
                              <TableHead className="w-10 text-muted-foreground">#</TableHead>
                              {tradeTableColumns.map((col) => (
                                <TableHead key={col} className="whitespace-nowrap text-muted-foreground">
                                  {humanizeTradeKey(col)}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tradeLogRows.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                                {tradeTableColumns.map((col) => (
                                  <TableCell key={col} className="whitespace-nowrap font-mono text-xs">
                                    {formatTradeCell(col, row[col])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {(!tradeLogRows || tradeLogRows.length === 0) &&
                  (backtestResult?.first_trade || backtestResult?.last_trade) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {backtestResult.first_trade && (
                        <div className="rounded-lg border border-border/60 bg-card/50 p-3 text-xs">
                          <p className="font-medium text-foreground mb-1">First trade</p>
                          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                            {JSON.stringify(backtestResult.first_trade, null, 2)}
                          </pre>
                        </div>
                      )}
                      {backtestResult.last_trade && (
                        <div className="rounded-lg border border-border/60 bg-card/50 p-3 text-xs">
                          <p className="font-medium text-foreground mb-1">Last trade</p>
                          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                            {JSON.stringify(backtestResult.last_trade, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                {backtestMeta && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {String(backtestMeta.symbol ?? backtestSymbol)} · {String(backtestMeta.timeframe ?? "")} ·{" "}
                    {String(backtestMeta.start_date ?? "")} → {String(backtestMeta.end_date ?? "")}
                  </p>
                )}
              </>
            )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
