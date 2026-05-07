import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Save, RotateCcw, LayoutTemplate, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import PerformanceChart, { type BacktestResultShape } from "@/components/strategy-builder/PerformanceChart";
import MarketIndexToday from "@/components/strategy-builder/MarketIndexToday";
import PrebuiltStrategyCard, { type PrebuiltStrategyId } from "@/components/strategy-builder/PrebuiltStrategyCard";
import {
  CustomBacktestConfigurator,
  defaultCustomBacktestDraft,
} from "@/components/strategy-builder/CustomBacktestConfigurator";
import { toast } from "sonner";
import { buildPrebuiltBacktestBody, getBackendStrategyName } from "@/lib/strategyBacktestPresets";
import { normalizeBacktestResponse } from "@/lib/normalizeBacktestResponse";
import { applyTimeframeToComponents, getRecipeById } from "@/lib/backtestRecipes";
import { marketGatewayFetch } from "@/lib/marketGateway";

export interface Condition {
  id: string;
  type: string;
  label: string;
  category: "entry" | "exit";
  parameters?: Record<string, any>;
}

function ymdDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - Math.max(0, Math.floor(daysAgo)));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function extractOhlcvCloseSeries(payload: unknown): number[] {
  const rows =
    Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object" && Array.isArray((payload as { rows?: unknown }).rows)
        ? (payload as { rows: unknown[] }).rows
        : payload && typeof payload === "object" && Array.isArray((payload as { ohlcv?: unknown }).ohlcv)
          ? (payload as { ohlcv: unknown[] }).ohlcv
          : [];
  const out: number[] = [];
  for (const row of rows as unknown[]) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const n = typeof r.close === "number" ? r.close : Number(r.close);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** Resample source series into n points using nearest index mapping. */
function resampleSeries(source: number[], n: number): number[] {
  if (!source.length || n <= 0) return [];
  if (source.length === n) return source.slice();
  if (n === 1) return [source[0]];
  return Array.from({ length: n }, (_, i) => {
    const idx = Math.round((i * (source.length - 1)) / (n - 1));
    return source[Math.max(0, Math.min(source.length - 1, idx))]!;
  });
}

const PREBUILT_STRATEGIES: {
  id: PrebuiltStrategyId;
  title: string;
  description: string;
}[] = [
  {
    id: "vegas-channel",
    title: "Vegas Channel",
    description:
      "Uses EMAs (e.g. 12/144/576) as dynamic support/resistance. Buy when price bounces off the channel; exit on break below or target.",
  },
  {
    id: "golden-cross",
    title: "Golden Cross",
    description:
      "Buy when short-term MA crosses above long-term MA (e.g. 50 above 200). Exit on death cross or stop/target.",
  },
];

const StrategyBuilder = () => {
  const [mode, setMode] = useState<"prebuilt" | "custom">("prebuilt");
  const [prebuiltSelected, setPrebuiltSelected] = useState<PrebuiltStrategyId | null>(null);
  const [customDraft, setCustomDraft] = useState(defaultCustomBacktestDraft);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const [backtestSymbol, setBacktestSymbol] = useState("AAPL");
  const [backtestStart, setBacktestStart] = useState(() => ymdDaysAgo(180));
  const [backtestEnd, setBacktestEnd] = useState(() => ymdDaysAgo(0));
  const [backtestTimeframe, setBacktestTimeframe] = useState("1d");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [backtestResult, setBacktestResult] = useState<BacktestResultShape | null>(null);
  const [backtestMeta, setBacktestMeta] = useState<Record<string, unknown> | null>(null);
  const [benchmarkCurve, setBenchmarkCurve] = useState<number[] | null>(null);

  const prebuiltPerfAnchorRef = useRef<HTMLDivElement>(null);
  const customPerfAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBacktestResult(null);
    setBacktestMeta(null);
    setBenchmarkCurve(null);
  }, [mode]);

  useEffect(() => {
    if (mode !== "prebuilt") return;
    setBacktestResult(null);
    setBacktestMeta(null);
    setBenchmarkCurve(null);
  }, [prebuiltSelected, mode]);

  const scrollToPerf = (scrollTab: "prebuilt" | "custom") => {
    window.requestAnimationFrame(() => {
      const el =
        scrollTab === "prebuilt" ? prebuiltPerfAnchorRef.current : customPerfAnchorRef.current;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const runMarketBacktest = async (
    body: Record<string, unknown>,
    normalizationKey: string,
    scrollTab: "prebuilt" | "custom",
  ) => {
    setIsBacktesting(true);
    setBacktestResult(null);
    setBacktestMeta(null);
    setBenchmarkCurve(null);

    try {
      const res = await marketGatewayFetch("/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        data?: unknown;
        meta?: Record<string, unknown>;
        error?: { message?: string };
      };

      if (!res.ok || json.error) {
        toast.error(json.error?.message ?? `Backtest failed (${res.status})`);
        return;
      }

      const rawPayload = json.data !== undefined && json.data !== null ? json.data : json;
      const normalized = normalizeBacktestResponse(rawPayload, normalizationKey);
      setBacktestResult(normalized);
      const m = json.meta ?? {};
      const normalizedMeta = {
        ...m,
        symbol: (m as { symbol?: string }).symbol ?? String(body.symbol),
        timeframe: (m as { timeframe?: string }).timeframe ?? String(body.timeframe),
        start_date: (m as { start_date?: string }).start_date ?? String(body.start_date),
        end_date: (m as { end_date?: string }).end_date ?? String(body.end_date),
      };
      setBacktestMeta(normalizedMeta);

      if (normalized?.equity_curve?.length) {
        try {
          const bmkSp = new URLSearchParams();
          bmkSp.set("interval", "1d");
          bmkSp.set("sort", "asc");
          bmkSp.set("start_date", String(normalizedMeta.start_date));
          bmkSp.set("end_date", String(normalizedMeta.end_date));
          bmkSp.set("limit", "2000");
          const bmkRes = await marketGatewayFetch("/market/ohlcv/SPY", {
            searchParams: bmkSp,
          });
          if (bmkRes.ok) {
            const bmkJson = (await bmkRes.json()) as { data?: unknown };
            const closes = extractOhlcvCloseSeries(bmkJson.data);
            const aligned = resampleSeries(closes, normalized.equity_curve.length);
            setBenchmarkCurve(aligned.length ? aligned : null);
          } else {
            setBenchmarkCurve(null);
          }
        } catch {
          setBenchmarkCurve(null);
        }
      } else {
        setBenchmarkCurve(null);
      }

      toast.success("Done — charts updated below.");
      scrollToPerf(scrollTab);
    } catch (e) {
      console.error(e);
      toast.error("Could not run backtest");
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleSimulate = async () => {
    const cap = Number(initialCapital);
    if (!Number.isFinite(cap) || cap <= 0) {
      toast.error("Use a positive starting capital");
      return;
    }
    if (!backtestSymbol.trim()) {
      toast.error("Enter a symbol");
      return;
    }

    if (mode === "prebuilt") {
      if (!prebuiltSelected) {
        toast.error("Choose a strategy first");
        return;
      }
      const body = buildPrebuiltBacktestBody(prebuiltSelected, {
        symbol: backtestSymbol,
        timeframe: backtestTimeframe,
        start_date: backtestStart,
        end_date: backtestEnd,
        initial_capital: cap,
      });
      await runMarketBacktest(body, getBackendStrategyName(prebuiltSelected), "prebuilt");
      return;
    }

    const name = customDraft.strategyName.trim();
    if (!name) {
      toast.error("Enter a strategy_name for this run");
      return;
    }

    const body: Record<string, unknown> = {
      strategy_name: name,
      symbol: backtestSymbol.trim(),
      timeframe: backtestTimeframe,
      start_date: backtestStart,
      end_date: backtestEnd,
      initial_capital: cap,
      components: applyTimeframeToComponents(customDraft.components, backtestTimeframe),
    };
    await runMarketBacktest(body, name, "custom");
  };

  const handleReset = () => {
    if (mode === "prebuilt") setPrebuiltSelected(null);
    else setCustomDraft(defaultCustomBacktestDraft());
    setBacktestResult(null);
    setBacktestMeta(null);
    setBenchmarkCurve(null);
    toast.info("Cleared");
  };

  const handleSave = () => {
    toast.success("Saved");
  };

  /** Both tabs force-mount charts; summaries must stay per-tab without depending on active `mode`. */
  const prebuiltPerformanceSummary =
    prebuiltSelected != null ? PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected) ?? null : null;

  const starterRecipeMeta = getRecipeById(customDraft.recipeId);
  const customPerformanceSummary = {
    title: customDraft.strategyName.trim() || "Custom strategy",
    description: starterRecipeMeta
      ? `Starter: ${starterRecipeMeta.title}. Tweak one block at a time (setup / trigger / exit) so A/B runs stay fair.`
      : "Configure setup, trigger, and exit, then run a live backtest.",
  };

  const selectedPrebuiltTitle = prebuiltSelected
    ? PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected)?.title ?? ""
    : null;

  const runBusy = isBacktesting;
  const strategyNamePreview = useMemo(() => {
    const base = selectedPrebuiltTitle ?? "Strategy";
    const symbol = backtestSymbol.trim().toUpperCase() || "TICKER";
    return `${base} · ${symbol} · ${backtestTimeframe}`;
  }, [selectedPrebuiltTitle, backtestSymbol, backtestTimeframe]);

  const datePresets = [
    { key: "1m", label: "1M", days: 30 },
    { key: "3m", label: "3M", days: 90 },
    { key: "6m", label: "6M", days: 180 },
    { key: "1y", label: "1Y", days: 365 },
    { key: "ytd", label: "YTD", days: 0 },
  ] as const;

  const applyDatePreset = (preset: (typeof datePresets)[number]) => {
    const end = ymdDaysAgo(0);
    if (preset.key === "ytd") {
      const y = new Date().getFullYear();
      setBacktestStart(`${y}-01-01`);
      setBacktestEnd(end);
      return;
    }
    setBacktestStart(ymdDaysAgo(preset.days));
    setBacktestEnd(end);
  };
  const runLabel = isBacktesting ? "Running…" : "Run";

  const prebuiltControls = (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configure</p>
          <p className="text-sm text-muted-foreground mt-0.5">Everything in one box: edit inputs and compare returns.</p>
        </div>
        {prebuiltSelected && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
            {selectedPrebuiltTitle}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Strategy profile</Label>
        <Select value={prebuiltSelected ?? ""} onValueChange={(v) => setPrebuiltSelected(v as PrebuiltStrategyId)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            {PREBUILT_STRATEGIES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">Smart name: {strategyNamePreview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sb-symbol" className="text-xs">
            Symbol
          </Label>
          <Input
            id="sb-symbol"
            value={backtestSymbol}
            onChange={(e) => setBacktestSymbol(e.target.value)}
            className="h-10 font-mono uppercase"
            placeholder="AAPL"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-start" className="text-xs">
            Start date
          </Label>
          <Input id="sb-start" type="date" value={backtestStart} onChange={(e) => setBacktestStart(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-end" className="text-xs">
            End date
          </Label>
          <Input
            id="sb-end"
            type="date"
            value={backtestEnd}
            max={ymdDaysAgo(0)}
            onChange={(e) => setBacktestEnd(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">Quick ranges (ending today)</p>
        <div className="flex flex-wrap gap-1.5">
          {datePresets.map((p) => (
            <Button key={p.key} type="button" variant="outline" size="sm" className="h-8" onClick={() => applyDatePreset(p)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Bars</Label>
          <Select value={backtestTimeframe} onValueChange={setBacktestTimeframe}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              {["1d", "1h", "15m", "5m", "1m"].map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-capital" className="text-xs">
            Starting capital
          </Label>
          <Input
            id="sb-capital"
            type="number"
            min={1}
            step="100"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Button size="lg" className="sm:flex-1 h-12" disabled={runBusy} onClick={handleSimulate}>
          <Play className="h-4 w-4 mr-2 shrink-0" />
          {runLabel}
        </Button>
        <div className="flex gap-2 justify-stretch sm:justify-end shrink-0">
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const customControls = (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configure</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rule blocks + dates here; the API receives <span className="font-mono text-foreground/90">strategy_name</span>,{" "}
            <span className="font-mono text-foreground/90">symbol</span>, and <span className="font-mono text-foreground/90">components</span>.
          </p>
        </div>
      </div>

      <CustomBacktestConfigurator draft={customDraft} onDraftChange={setCustomDraft} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sb-c-symbol" className="text-xs">
            Symbol
          </Label>
          <Input
            id="sb-c-symbol"
            value={backtestSymbol}
            onChange={(e) => setBacktestSymbol(e.target.value)}
            className="h-10 font-mono uppercase"
            placeholder="AAPL"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-c-start" className="text-xs">
            Start date
          </Label>
          <Input
            id="sb-c-start"
            type="date"
            value={backtestStart}
            onChange={(e) => setBacktestStart(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-c-end" className="text-xs">
            End date
          </Label>
          <Input
            id="sb-c-end"
            type="date"
            value={backtestEnd}
            max={ymdDaysAgo(0)}
            onChange={(e) => setBacktestEnd(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">Quick ranges (ending today)</p>
        <div className="flex flex-wrap gap-1.5">
          {datePresets.map((p) => (
            <Button key={`c-${p.key}`} type="button" variant="outline" size="sm" className="h-8" onClick={() => applyDatePreset(p)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Bars</Label>
          <Select value={backtestTimeframe} onValueChange={setBacktestTimeframe}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              {["1d", "1h", "15m", "5m", "1m"].map((tf) => (
                <SelectItem key={`c-${tf}`} value={tf}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-c-capital" className="text-xs">
            Starting capital
          </Label>
          <Input
            id="sb-c-capital"
            type="number"
            min={1}
            step="100"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Button size="lg" className="sm:flex-1 h-12" disabled={runBusy} onClick={handleSimulate}>
          <Play className="h-4 w-4 mr-2 shrink-0" />
          {runLabel}
        </Button>
        <div className="flex gap-2 justify-stretch sm:justify-end shrink-0">
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-5">
          <MarketIndexToday />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">Strategy Builder</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            <span className="text-foreground/90 font-medium">Prebuilt:</span> pick a curated profile, tune symbol & dates,
            run — charts update from the `/backtest` API.{" "}
            <span className="text-foreground/90 font-medium">Custom:</span> start from the same starter recipes used in the docs,
            rename <span className="font-mono text-foreground/80">strategy_name</span> for experiments, tweak setup / trigger / exit blocks, then run the same live backtest pipeline.
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "prebuilt" | "custom")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 h-11">
            <TabsTrigger value="prebuilt" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Prebuilt
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prebuilt" className={cn("mt-0 space-y-5", mode !== "prebuilt" && "hidden")} forceMount>
            {/* Step 1 — strategy */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">1 · Strategy</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PREBUILT_STRATEGIES.map((strategy) => (
                  <PrebuiltStrategyCard
                    key={strategy.id}
                    id={strategy.id}
                    title={strategy.title}
                    description={strategy.description}
                    selected={prebuiltSelected === strategy.id}
                    onSelect={() => setPrebuiltSelected((prev) => (prev === strategy.id ? null : strategy.id))}
                  />
                ))}
              </div>
            </div>

            <div ref={prebuiltPerfAnchorRef} className="scroll-mt-24">
              <PerformanceChart
                mode="prebuilt"
                prebuiltStrategySelected={Boolean(prebuiltSelected)}
                isBacktesting={isBacktesting}
                strategySummary={prebuiltPerformanceSummary}
                backtestSymbol={backtestSymbol}
                backtestResult={backtestResult}
                backtestMeta={backtestMeta}
                benchmarkCurve={benchmarkCurve}
                benchmarkLabel="S&P 500 (SPY)"
                prebuiltControls={prebuiltControls}
              />
            </div>
          </TabsContent>

          <TabsContent value="custom" className={cn("mt-0 space-y-5", mode !== "custom" && "hidden")} forceMount>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Use starters that mirror the `/backtest` payloads, keep short date ranges while iterating, and change only
              one layer (setup, trigger, or exit) between runs so comparisons stay fair. Rename <span className="font-mono">strategy_name</span>{" "}
              per experiment (see Suggest).
            </p>

            <div ref={customPerfAnchorRef} className="scroll-mt-24">
              <PerformanceChart
                mode="custom"
                prebuiltStrategySelected
                isBacktesting={isBacktesting}
                strategySummary={customPerformanceSummary}
                backtestSymbol={backtestSymbol}
                backtestResult={backtestResult}
                backtestMeta={backtestMeta}
                benchmarkCurve={benchmarkCurve}
                benchmarkLabel="S&P 500 (SPY)"
                customControls={customControls}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StrategyBuilder;
