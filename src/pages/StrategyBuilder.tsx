import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Play, Save, RotateCcw, Sparkles, LayoutTemplate, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import ConditionLibrary from "@/components/strategy-builder/ConditionLibrary";
import StrategyCanvas from "@/components/strategy-builder/StrategyCanvas";
import PerformanceChart, { type BacktestResultShape } from "@/components/strategy-builder/PerformanceChart";
import MarketIndexToday from "@/components/strategy-builder/MarketIndexToday";
import PrebuiltStrategyCard, { type PrebuiltStrategyId } from "@/components/strategy-builder/PrebuiltStrategyCard";
import FullCustomization from "@/components/strategy-builder/FullCustomization";
import { toast } from "sonner";
import { buildPrebuiltBacktestBody } from "@/lib/strategyBacktestPresets";

export interface Condition {
  id: string;
  type: string;
  label: string;
  category: "entry" | "exit";
  parameters?: Record<string, any>;
}

const MARKET_API_BASE_URL =
  import.meta.env.VITE_MARKET_API_BASE_URL ||
  "https://8p52xermu7.execute-api.ca-west-1.amazonaws.com/v1";
const MARKET_API_KEY =
  import.meta.env.VITE_MARKET_API_KEY || import.meta.env.VITE_SERVING_API_KEY || "";

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
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const [backtestSymbol, setBacktestSymbol] = useState("AAPL");
  const [backtestStart, setBacktestStart] = useState("2025-01-01");
  const [backtestEnd, setBacktestEnd] = useState("2025-01-31");
  const [backtestTimeframe, setBacktestTimeframe] = useState("1d");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [backtestResult, setBacktestResult] = useState<BacktestResultShape | null>(null);
  const [backtestMeta, setBacktestMeta] = useState<Record<string, unknown> | null>(null);

  const performanceAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBacktestResult(null);
    setBacktestMeta(null);
  }, [prebuiltSelected]);

  useEffect(() => {
    if (mode === "custom") {
      setBacktestResult(null);
      setBacktestMeta(null);
      setIsBacktesting(false);
    }
  }, [mode]);

  const handleDrop = (condition: Condition) => {
    setSelectedConditions([...selectedConditions, { ...condition, id: `${condition.id}-${Date.now()}` }]);
    toast.success(`Added: ${condition.label}`);
  };

  const handleRemoveCondition = (id: string) => {
    setSelectedConditions(selectedConditions.filter((c) => c.id !== id));
    toast.info("Condition removed");
  };

  const handleSimulate = async () => {
    if (mode === "prebuilt") {
      if (!prebuiltSelected) {
        toast.error("Choose a strategy first");
        return;
      }
      if (!backtestSymbol.trim()) {
        toast.error("Enter a symbol");
        return;
      }
      const cap = Number(initialCapital);
      if (!Number.isFinite(cap) || cap <= 0) {
        toast.error("Use a positive starting capital");
        return;
      }

      setIsBacktesting(true);
      setBacktestResult(null);
      setBacktestMeta(null);

      try {
        const body = buildPrebuiltBacktestBody(prebuiltSelected, {
          symbol: backtestSymbol,
          timeframe: backtestTimeframe,
          start_date: backtestStart,
          end_date: backtestEnd,
          initial_capital: cap,
        });

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

        const res = await fetch(`${MARKET_API_BASE_URL}/backtest`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        const json = (await res.json()) as {
          data?: BacktestResultShape;
          meta?: Record<string, unknown>;
          error?: { message?: string };
        };

        if (!res.ok || json.error) {
          toast.error(json.error?.message ?? `Backtest failed (${res.status})`);
          return;
        }

        setBacktestResult(json.data ?? null);
        setBacktestMeta(json.meta ?? null);
        toast.success("Done — charts updated below.");
        window.requestAnimationFrame(() => {
          performanceAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch (e) {
        console.error(e);
        toast.error("Could not run backtest");
      } finally {
        setIsBacktesting(false);
      }
      return;
    }

    if (selectedConditions.length === 0) {
      toast.error("Add at least one condition");
      return;
    }
    setIsSimulating(true);
    toast.success("Running…");
    setTimeout(() => {
      setIsSimulating(false);
      toast.success("Done");
      performanceAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 2000);
  };

  const handleReset = () => {
    if (mode === "prebuilt") {
      setPrebuiltSelected(null);
      setBacktestResult(null);
      setBacktestMeta(null);
    } else setSelectedConditions([]);
    toast.info("Cleared");
  };

  const handleSave = () => {
    toast.success("Saved");
  };

  const conditionsForChart =
    mode === "prebuilt" && prebuiltSelected
      ? [
          {
            id: prebuiltSelected,
            type: prebuiltSelected,
            label: PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected)?.title ?? prebuiltSelected,
            category: "entry" as const,
          },
        ]
      : selectedConditions;

  const strategySummary =
    mode === "prebuilt" && prebuiltSelected
      ? PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected)
      : mode === "custom"
        ? {
            title: "Custom strategy",
            description: selectedConditions.length
              ? `Rules: ${selectedConditions.map((c) => c.label).join(", ")}`
              : "Drag conditions onto the canvas to build rules.",
          }
        : null;

  const selectedPrebuiltTitle = prebuiltSelected
    ? PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected)?.title ?? ""
    : null;

  const runBusy = isSimulating || isBacktesting;
  const runLabel =
    mode === "prebuilt"
      ? isBacktesting
        ? "Running…"
        : "Run"
      : isSimulating
        ? "Running…"
        : "Run";

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
            <span className="text-foreground/90 font-medium">Prebuilt:</span> pick a strategy, set symbol & dates, then
            run — results appear in the chart right under this workspace.{" "}
            <span className="text-foreground/90 font-medium">Custom:</span> experiment with rule blocks; charts are for
            layout preview only.
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

            {/* Step 2 + 3 — configure & run */}
            <Card className="p-5 shadow-card border-primary/15 bg-card/80">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    2 · What to test
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Symbol and calendar range for this strategy{selectedPrebuiltTitle ? `: ${selectedPrebuiltTitle}` : ""}.
                  </p>
                </div>
                {prebuiltSelected && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                    {selectedPrebuiltTitle}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Input
                    id="sb-start"
                    type="date"
                    value={backtestStart}
                    onChange={(e) => setBacktestStart(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-end" className="text-xs">
                    End date
                  </Label>
                  <Input id="sb-end" type="date" value={backtestEnd} onChange={(e) => setBacktestEnd(e.target.value)} className="h-10" />
                </div>
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
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
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

              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-6 mb-2">3 · Run</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Button
                  size="lg"
                  className="sm:flex-1 bg-gradient-primary hover:opacity-90 h-11"
                  disabled={runBusy}
                  onClick={handleSimulate}
                >
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
              <p className="text-[11px] text-muted-foreground mt-3">After you run, we scroll down to the performance section.</p>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className={cn("mt-0 space-y-5", mode !== "custom" && "hidden")} forceMount>
            <p className="text-sm text-muted-foreground">
              Build rules below, then run the preview chart. Save keeps your workspace only (not synced to trades).
            </p>
            <FullCustomization />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 shadow-card">
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Conditions
                </h2>
                <Tabs defaultValue="entry" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="entry">Buy</TabsTrigger>
                    <TabsTrigger value="exit">Sell</TabsTrigger>
                  </TabsList>
                  <TabsContent value="entry">
                    <div className="grid grid-cols-2 gap-2">
                      <ConditionLibrary category="entry" onDrop={handleDrop} />
                    </div>
                  </TabsContent>
                  <TabsContent value="exit">
                    <div className="grid grid-cols-2 gap-2">
                      <ConditionLibrary category="exit" onDrop={handleDrop} />
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
              <StrategyCanvas
                conditions={selectedConditions}
                onRemoveCondition={handleRemoveCondition}
                onAddCondition={(condition) => setSelectedConditions([...selectedConditions, condition])}
              />
            </div>

            <Card className="p-4 shadow-card flex flex-wrap gap-3 items-center justify-between">
              <p className="text-sm text-muted-foreground flex-1 min-w-[160px]">Preview updates from your rule stack.</p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button className="flex-1 sm:flex-initial bg-gradient-primary h-10" disabled={runBusy} onClick={handleSimulate}>
                  <Play className="h-4 w-4 mr-2" />
                  {runLabel}
                </Button>
                <Button variant="outline" className="h-10" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div ref={performanceAnchorRef} className="scroll-mt-24 mt-10 w-full">
          <PerformanceChart
            mode={mode}
            prebuiltStrategySelected={Boolean(prebuiltSelected)}
            isSimulating={isSimulating}
            isBacktesting={isBacktesting}
            conditions={conditionsForChart}
            strategySummary={strategySummary}
            backtestSymbol={backtestSymbol}
            backtestResult={backtestResult}
            backtestMeta={backtestMeta}
          />
        </div>
      </main>
    </div>
  );
};

export default StrategyBuilder;
