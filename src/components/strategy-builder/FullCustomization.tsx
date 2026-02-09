import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, TrendingUp, TrendingDown, Settings2 } from "lucide-react";

const INDICATORS = [
  { value: "sma", label: "SMA" },
  { value: "ema", label: "EMA" },
  { value: "rsi", label: "RSI" },
  { value: "macd", label: "MACD" },
  { value: "bollinger", label: "Bollinger Bands" },
];

const INTERVALS = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
];

const CANDLE_BEHAVIORS = [
  { value: "cross-above", label: "Cross above" },
  { value: "cross-below", label: "Cross below" },
  { value: "shooting-star", label: "Shooting star" },
  { value: "hammer", label: "Hammer" },
  { value: "engulfing-bull", label: "Bullish engulfing" },
  { value: "engulfing-bear", label: "Bearish engulfing" },
  { value: "doji", label: "Doji" },
  { value: "higher-high", label: "Higher high" },
  { value: "lower-low", label: "Lower low" },
];

interface IndicatorConfig {
  id: string;
  type: string;
  params: Record<string, string>;
}

const FullCustomization = () => {
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [intervalMode, setIntervalMode] = useState<"single" | "multi">("single");
  const [singleInterval, setSingleInterval] = useState("1h");
  const [multiIntervals, setMultiIntervals] = useState<string[]>([]);
  const [buyBehavior, setBuyBehavior] = useState<string>("cross-above");
  const [buyIndicatorRef, setBuyIndicatorRef] = useState<string>("none");
  const [sellBehavior, setSellBehavior] = useState<string>("cross-below");
  const [sellIndicatorRef, setSellIndicatorRef] = useState<string>("none");

  const addIndicator = () => {
    setIndicators([
      ...indicators,
      {
        id: `ind-${Date.now()}`,
        type: "sma",
        params: { period: "20" },
      },
    ]);
  };

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter((i) => i.id !== id));
  };

  const updateIndicator = (id: string, field: "type" | "params", value: any) => {
    setIndicators(
      indicators.map((i) =>
        i.id === id ? { ...i, [field]: value } : i
      )
    );
  };

  const toggleMultiInterval = (interval: string) => {
    setMultiIntervals((prev) =>
      prev.includes(interval) ? prev.filter((x) => x !== interval) : [...prev, interval]
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicators & parameters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Indicators & parameters
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addIndicator}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-3">
          {indicators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Add indicators and set periods/thresholds (e.g. SMA 20, RSI 30).
            </p>
          ) : (
            indicators.map((ind) => (
              <div
                key={ind.id}
                className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-muted/20"
              >
                <Select
                  value={ind.type}
                  onValueChange={(v) => updateIndicator(ind.id, "type", v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDICATORS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Period (e.g. 20)"
                  className="w-24"
                  value={ind.params?.period ?? ""}
                  onChange={(e) =>
                    updateIndicator(ind.id, "params", {
                      ...ind.params,
                      period: e.target.value,
                    })
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeIndicator(ind.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Interval */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Trading interval</h3>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="intervalMode"
              checked={intervalMode === "single"}
              onChange={() => setIntervalMode("single")}
              className="rounded-full"
            />
            <span className="text-sm">Single timeframe</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="intervalMode"
              checked={intervalMode === "multi"}
              onChange={() => setIntervalMode("multi")}
              className="rounded-full"
            />
            <span className="text-sm">Multi-timeframe</span>
          </label>
        </div>
        {intervalMode === "single" ? (
          <Select value={singleInterval} onValueChange={setSingleInterval}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVALS.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-wrap gap-2">
            {INTERVALS.map((i) => (
              <Button
                key={i}
                type="button"
                size="sm"
                variant={multiIntervals.includes(i) ? "default" : "outline"}
                onClick={() => toggleMultiInterval(i)}
              >
                {i}
              </Button>
            ))}
          </div>
        )}
      </Card>

      {/* Buy & Sell conditions */}
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Buy condition
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Sell condition
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buy" className="mt-3">
          <Card className="p-4">
            <Label className="text-muted-foreground">Candle behaviour</Label>
            <Select value={buyBehavior} onValueChange={setBuyBehavior}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="e.g. Cross above, Shooting star" />
              </SelectTrigger>
              <SelectContent>
                {CANDLE_BEHAVIORS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-muted-foreground mt-3 block">With indicator (optional)</Label>
            <Select value={buyIndicatorRef} onValueChange={setBuyIndicatorRef}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Reference indicator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {indicators.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {INDICATORS.find((x) => x.value === i.type)?.label ?? i.type} {i.params?.period && `(${i.params.period})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </TabsContent>
        <TabsContent value="sell" className="mt-3">
          <Card className="p-4">
            <Label className="text-muted-foreground">Candle behaviour</Label>
            <Select value={sellBehavior} onValueChange={setSellBehavior}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="e.g. Cross below, Bearish engulfing" />
              </SelectTrigger>
              <SelectContent>
                {CANDLE_BEHAVIORS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-muted-foreground mt-3 block">With indicator (optional)</Label>
            <Select value={sellIndicatorRef} onValueChange={setSellIndicatorRef}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Reference indicator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {indicators.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {INDICATORS.find((x) => x.value === i.type)?.label ?? i.type} {i.params?.period && `(${i.params.period})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FullCustomization;
