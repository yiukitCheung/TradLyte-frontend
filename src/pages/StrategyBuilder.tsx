import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save, RotateCcw, Sparkles, LayoutTemplate, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import ConditionLibrary from "@/components/strategy-builder/ConditionLibrary";
import StrategyCanvas from "@/components/strategy-builder/StrategyCanvas";
import PerformanceChart from "@/components/strategy-builder/PerformanceChart";
import MarketIndexToday from "@/components/strategy-builder/MarketIndexToday";
import PrebuiltStrategyCard, { type PrebuiltStrategyId } from "@/components/strategy-builder/PrebuiltStrategyCard";
import FullCustomization from "@/components/strategy-builder/FullCustomization";
import { toast } from "sonner";

export interface Condition {
  id: string;
  type: string;
  label: string;
  category: "entry" | "exit";
  parameters?: Record<string, any>;
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
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleDrop = (condition: Condition) => {
    setSelectedConditions([...selectedConditions, { ...condition, id: `${condition.id}-${Date.now()}` }]);
    toast.success(`Added: ${condition.label}`);
  };

  const handleRemoveCondition = (id: string) => {
    setSelectedConditions(selectedConditions.filter((c) => c.id !== id));
    toast.info("Condition removed");
  };

  const handleSimulate = () => {
    if (mode === "prebuilt" && !prebuiltSelected) {
      toast.error("Select a prebuilt strategy to simulate");
      return;
    }
    if (mode === "custom" && selectedConditions.length === 0) {
      toast.error("Add at least one condition to simulate");
      return;
    }
    setIsSimulating(true);
    toast.success("Running simulation...");
    setTimeout(() => {
      setIsSimulating(false);
      toast.success("Simulation complete!");
    }, 2000);
  };

  const handleReset = () => {
    if (mode === "prebuilt") setPrebuiltSelected(null);
    else setSelectedConditions([]);
    toast.info("Strategy reset");
  };

  const handleSave = () => {
    toast.success("Strategy saved!");
  };

  const conditionsForChart = mode === "prebuilt" && prebuiltSelected
    ? [{ id: prebuiltSelected, type: prebuiltSelected, label: PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected)?.title ?? prebuiltSelected, category: "entry" as const }]
    : selectedConditions;

  const strategySummary =
    mode === "prebuilt" && prebuiltSelected
      ? PREBUILT_STRATEGIES.find((s) => s.id === prebuiltSelected)
      : mode === "custom"
        ? { title: "Custom strategy", description: selectedConditions.length ? `Entry/exit rules: ${selectedConditions.map((c) => c.label).join(", ")}` : "Configure indicators, interval, and buy/sell conditions below." }
        : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Market index today - subtle top strip */}
        <div className="mb-4">
          <MarketIndexToday />
        </div>

        {/* Header Section */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                Strategy Builder
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Design and test your investment strategies
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4 mr-2" />
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </Button>
            <Button onClick={handleSave} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleReset} variant="outline" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mode: Prebuilt vs Full customization */}
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "prebuilt" | "custom")}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="prebuilt" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Prebuilt strategy
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Full customization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prebuilt" className={cn("mt-0 space-y-6", mode !== "prebuilt" && "hidden")} forceMount>
            <p className="text-sm text-muted-foreground">
              Choose one of the strategies below. Each is defined by clear rules for entry and exit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREBUILT_STRATEGIES.map((strategy) => (
                <PrebuiltStrategyCard
                  key={strategy.id}
                  id={strategy.id}
                  title={strategy.title}
                  description={strategy.description}
                  selected={prebuiltSelected === strategy.id}
                  onSelect={() =>
                    setPrebuiltSelected((prev) => (prev === strategy.id ? null : strategy.id))
                  }
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className={cn("mt-0 space-y-6", mode !== "custom" && "hidden")} forceMount>
            <p className="text-sm text-muted-foreground">
              Configure indicators, timeframe(s), and candle-based buy/sell conditions.
            </p>
            <FullCustomization />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              <Card className="p-6 shadow-card">
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Condition Library
                </h2>
                <Tabs defaultValue="entry" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="entry">Entry (Buy)</TabsTrigger>
                    <TabsTrigger value="exit">Exit (Sell)</TabsTrigger>
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
                onAddCondition={(condition) =>
                  setSelectedConditions([...selectedConditions, condition])
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Performance Chart + Strategy hover */}
        <div className="mt-8 w-full">
          <PerformanceChart
            isSimulating={isSimulating}
            conditions={conditionsForChart}
            strategySummary={strategySummary}
          />
        </div>
      </main>
    </div>
  );
};

export default StrategyBuilder;
