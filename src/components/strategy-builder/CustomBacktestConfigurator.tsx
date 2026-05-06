import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  BACKTEST_RECIPES,
  type StrategyComponents,
  cloneRecipeComponents,
  suggestExperimentStrategyName,
} from "@/lib/backtestRecipes";
import { FlaskConical, Wand2 } from "lucide-react";

export interface CustomBacktestDraft {
  recipeId: string;
  strategyName: string;
  components: StrategyComponents;
}

interface CustomBacktestConfiguratorProps {
  draft: CustomBacktestDraft;
  onDraftChange: (next: CustomBacktestDraft) => void;
}

const RSI_OPERATORS = [">", "<", ">=", "<="] as const;
const CROSSOVER_TYPES = [{ v: "GOLDEN_CROSS", l: "Golden cross" }] as const;
const PRICE_DIRECTION = ["ABOVE", "BELOW"] as const;
const SETUP_TYPES = ["NONE", "INDICATOR_THRESHOLD"] as const;
const EXIT_TYPES = [
  "TAKE_PROFIT_PCT",
  "CONDITIONAL_OR_FIXED",
  "TIME_BASED",
  "TRAILING_STOP_PCT",
] as const;
const PATTERNS = ["GREEN_CANDLE", "BULLISH_ENGULFING"] as const;

export function CustomBacktestConfigurator({ draft, onDraftChange }: CustomBacktestConfiguratorProps) {
  const { setup, trigger, exit } = draft.components;

  const patch = useCallback(
    (patchIn: Partial<StrategyComponents>) => {
      onDraftChange({
        ...draft,
        components: {
          setup: patchIn.setup ?? draft.components.setup,
          trigger: patchIn.trigger ?? draft.components.trigger,
          exit: patchIn.exit ?? draft.components.exit,
        },
      });
    },
    [draft, onDraftChange],
  );

  const applyRecipe = (recipeId: string) => {
    const built = cloneRecipeComponents(recipeId);
    const recipeMeta = BACKTEST_RECIPES.find((r) => r.id === recipeId);
    if (!built || !recipeMeta) return;
    onDraftChange({
      recipeId,
      strategyName: recipeMeta.strategy_name,
      components: built,
    });
  };

  const handleSuggestName = () => {
    onDraftChange({ ...draft, strategyName: suggestExperimentStrategyName(draft.components) });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Strategy lab
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Start from a starter recipe, tweak one layer at a time, then hit Run on the chart below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Starter recipe</Label>
          <Select value={draft.recipeId} onValueChange={(v) => applyRecipe(v)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BACKTEST_RECIPES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="font-medium">{r.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {BACKTEST_RECIPES.find((x) => x.id === draft.recipeId)?.description ?? ""}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="custom-strategy-name">
            strategy_name sent to API
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="custom-strategy-name"
              value={draft.strategyName}
              onChange={(e) => onDraftChange({ ...draft, strategyName: e.target.value })}
              placeholder="exp01_custom…"
              className="h-10 font-mono text-sm flex-1 min-w-[12rem]"
            />
            <Button type="button" variant="outline" size="sm" className="h-10 shrink-0" onClick={handleSuggestName}>
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Suggest
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Change only one block (setup/trigger/exit) between runs when comparing runs fairly.
          </p>
        </div>
      </div>

      <Card className="p-4 border-border/70 bg-muted/20">
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="setup" className="text-xs sm:text-sm">
              Setup filter
            </TabsTrigger>
            <TabsTrigger value="trigger" className="text-xs sm:text-sm">
              Entry trigger
            </TabsTrigger>
            <TabsTrigger value="exit" className="text-xs sm:text-sm">
              Exit logic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-4 space-y-3 focus-visible:outline-none">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={String(setup.type ?? "NONE")}
                onValueChange={(v) => {
                  const tf = String(setup.timeframe ?? "1d");
                  if (v === "NONE") patch({ setup: { type: "NONE", timeframe: tf } });
                  else
                    patch({
                      setup: {
                        type: "INDICATOR_THRESHOLD",
                        timeframe: tf,
                        indicator: "RSI",
                        operator: ">",
                        value: 50,
                      },
                    });
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETUP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "NONE" ? "None (always pass)" : "Indicator threshold"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {String(setup.type) === "INDICATOR_THRESHOLD" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Indicator</Label>
                  <Select
                    value={String(setup.indicator ?? "RSI")}
                    onValueChange={(ind) =>
                      patch({ setup: { ...setup, type: "INDICATOR_THRESHOLD", indicator: ind } })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RSI">RSI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={String(setup.operator ?? ">")}
                    onValueChange={(op) =>
                      patch({ setup: { ...setup, type: "INDICATOR_THRESHOLD", operator: op } })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RSI_OPERATORS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="number"
                    className="h-10"
                    value={setup.value !== undefined ? String(setup.value) : ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      patch({
                        setup: {
                          ...setup,
                          type: "INDICATOR_THRESHOLD",
                          value: Number.isFinite(n) ? n : 0,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trigger" className="mt-4 space-y-4 focus-visible:outline-none">
            <div className="space-y-1.5">
              <Label className="text-xs">Trigger type</Label>
              <Select
                value={String(trigger.type ?? "CANDLE_PATTERN")}
                onValueChange={(v) => {
                  const tf = String(trigger.timeframe ?? "1d");
                  if (v === "CANDLE_PATTERN")
                    patch({ trigger: { type: "CANDLE_PATTERN", timeframe: tf, pattern: "GREEN_CANDLE" } });
                  else if (v === "INDICATOR_CROSSOVER")
                    patch({
                      trigger: {
                        type: "INDICATOR_CROSSOVER",
                        timeframe: tf,
                        indicator1: "ema_8",
                        indicator2: "ema_21",
                        crossover_type: "GOLDEN_CROSS",
                      },
                    });
                  else
                    patch({
                      trigger: {
                        type: "PRICE_CROSSOVER",
                        timeframe: tf,
                        price_level: 400,
                        direction: "ABOVE",
                      },
                    });
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CANDLE_PATTERN">Candle pattern</SelectItem>
                  <SelectItem value="INDICATOR_CROSSOVER">Indicator crossover</SelectItem>
                  <SelectItem value="PRICE_CROSSOVER">Price level crossover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {String(trigger.type) === "CANDLE_PATTERN" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Pattern</Label>
                <Select
                  value={String(trigger.pattern ?? "GREEN_CANDLE")}
                  onValueChange={(p) => patch({ trigger: { ...trigger, type: "CANDLE_PATTERN", pattern: p } })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATTERNS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.replace(/_/g, " ").toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {String(trigger.type) === "INDICATOR_CROSSOVER" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fast / line 1</Label>
                  <Select
                    value={String(trigger.indicator1 ?? "ema_8")}
                    onValueChange={(x) =>
                      patch({ trigger: { ...trigger, type: "INDICATOR_CROSSOVER", indicator1: x } })
                    }
                  >
                    <SelectTrigger className="h-10 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["ema_8", "ema_21", "sma_50", "sma_200"].map((id) => (
                        <SelectItem key={id} value={id} className="font-mono">
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slow / line 2</Label>
                  <Select
                    value={String(trigger.indicator2 ?? "ema_21")}
                    onValueChange={(x) =>
                      patch({ trigger: { ...trigger, type: "INDICATOR_CROSSOVER", indicator2: x } })
                    }
                  >
                    <SelectTrigger className="h-10 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["ema_21", "ema_50", "sma_50", "sma_200"].map((id) => (
                        <SelectItem key={id} value={id} className="font-mono">
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Crossover semantics</Label>
                  <Select
                    value={String(trigger.crossover_type ?? "GOLDEN_CROSS")}
                    onValueChange={(x) =>
                      patch({ trigger: { ...trigger, type: "INDICATOR_CROSSOVER", crossover_type: x } })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CROSSOVER_TYPES.map((c) => (
                        <SelectItem key={c.v} value={c.v}>
                          {c.l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {String(trigger.type) === "PRICE_CROSSOVER" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Price level</Label>
                  <Input
                    type="number"
                    className="h-10"
                    value={trigger.price_level !== undefined ? String(trigger.price_level) : ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      patch({
                        trigger: {
                          ...trigger,
                          type: "PRICE_CROSSOVER",
                          price_level: Number.isFinite(n) ? n : 0,
                        },
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Direction</Label>
                  <Select
                    value={String(trigger.direction ?? "ABOVE")}
                    onValueChange={(d) =>
                      patch({ trigger: { ...trigger, type: "PRICE_CROSSOVER", direction: d } })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_DIRECTION.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="exit" className="mt-4 space-y-4 focus-visible:outline-none">
            <div className="space-y-1.5">
              <Label className="text-xs">Exit type</Label>
              <Select
                value={String(exit.type ?? "TAKE_PROFIT_PCT")}
                onValueChange={(v) => {
                  const tf = String(exit.timeframe ?? "1d");
                  if (v === "TAKE_PROFIT_PCT")
                    patch({ exit: { type: "TAKE_PROFIT_PCT", timeframe: tf, value: 0.1 } });
                  else if (v === "CONDITIONAL_OR_FIXED")
                    patch({
                      exit: {
                        type: "CONDITIONAL_OR_FIXED",
                        timeframe: tf,
                        conditions: [
                          { type: "STOP_LOSS_PCT", value: 0.05 },
                          { type: "TAKE_PROFIT_PCT", value: 0.12 },
                        ],
                      },
                    });
                  else if (v === "TIME_BASED")
                    patch({ exit: { type: "TIME_BASED", timeframe: tf, max_holding_days: 10 } });
                  else patch({ exit: { type: "TRAILING_STOP_PCT", timeframe: tf, value: 0.03 } });
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {String(exit.type) === "TAKE_PROFIT_PCT" && (
              <div className="space-y-1.5 max-w-[14rem]">
                <Label className="text-xs">Take-profit (decimal, e.g. 0.1 = +10%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-10"
                  value={exit.value !== undefined ? String(exit.value) : ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    patch({ exit: { ...exit, type: "TAKE_PROFIT_PCT", value: Number.isFinite(n) ? n : 0 } });
                  }}
                />
              </div>
            )}

            {String(exit.type) === "CONDITIONAL_OR_FIXED" && (
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {(["STOP_LOSS_PCT", "TAKE_PROFIT_PCT"] as const).map((kind) => {
                  const raw = exit.conditions;
                  const idx = Array.isArray(raw)
                    ? raw.findIndex((c) => c && typeof c === "object" && (c as { type?: string }).type === kind)
                    : -1;
                  const val =
                    idx >= 0 && raw && Array.isArray(raw)
                      ? Number((raw[idx] as { value?: unknown }).value)
                      : kind === "STOP_LOSS_PCT"
                        ? 0.05
                        : 0.12;
                  return (
                    <div key={kind} className="space-y-1.5">
                      <Label className="text-xs">{kind.replace(/_/g, " ")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10"
                        value={Number.isFinite(val) ? String(val) : ""}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const nextConditions = [...(Array.isArray(exit.conditions) ? exit.conditions : [])];
                          const i = nextConditions.findIndex(
                            (c) => c && typeof c === "object" && (c as { type?: string }).type === kind,
                          );
                          const row = { type: kind, value: Number.isFinite(n) ? n : 0 };
                          if (i >= 0) nextConditions[i] = row;
                          else nextConditions.push(row);
                          patch({
                            exit: {
                              ...exit,
                              type: "CONDITIONAL_OR_FIXED",
                              conditions: nextConditions,
                            },
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {String(exit.type) === "TIME_BASED" && (
              <div className="space-y-1.5 max-w-[14rem]">
                <Label className="text-xs">Max holding days</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="h-10"
                  value={exit.max_holding_days !== undefined ? String(exit.max_holding_days) : ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    patch({
                      exit: {
                        ...exit,
                        type: "TIME_BASED",
                        max_holding_days: Number.isFinite(n) ? Math.round(n) : 1,
                      },
                    });
                  }}
                />
              </div>
            )}

            {String(exit.type) === "TRAILING_STOP_PCT" && (
              <div className="space-y-1.5 max-w-[14rem]">
                <Label className="text-xs">Trail % (decimal)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-10"
                  value={exit.value !== undefined ? String(exit.value) : ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    patch({
                      exit: { ...exit, type: "TRAILING_STOP_PCT", value: Number.isFinite(n) ? n : 0 },
                    });
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

export function defaultCustomBacktestDraft(): CustomBacktestDraft {
  const first = BACKTEST_RECIPES[0];
  const built = cloneRecipeComponents(first.id)!;
  return { recipeId: first.id, strategyName: first.strategy_name, components: built };
}
