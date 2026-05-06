/** Shapes match serving `/backtest` `components`: setup, trigger, exit. */

export type ComponentBlock = Record<string, unknown>;

export interface StrategyComponents {
  setup: ComponentBlock;
  trigger: ComponentBlock;
  exit: ComponentBlock;
}

export interface BacktestRecipe {
  id: string;
  title: string;
  description: string;
  strategy_name: string;
  components: StrategyComponents;
}

function componentsFrom(recipe: StrategyComponents): StrategyComponents {
  return {
    setup: { ...recipe.setup },
    trigger: { ...recipe.trigger },
    exit: structuredCloneStructuredExit(recipe.exit),
  };
}

function structuredCloneStructuredExit(exit: ComponentBlock): ComponentBlock {
  const raw = exit.conditions;
  if (Array.isArray(raw)) {
    return {
      ...exit,
      conditions: raw.map((c) => (c && typeof c === "object" ? { ...(c as object) } : c)),
    };
  }
  return { ...exit };
}

/** Five reference payloads (+ metadata) aligned with backend examples. */
export const BACKTEST_RECIPES: BacktestRecipe[] = [
  {
    id: "smoke_test",
    title: "Smoke test",
    description: "Very permissive — quick sanity check on any symbol.",
    strategy_name: "smoke_test",
    components: {
      setup: { type: "NONE", timeframe: "1d" },
      trigger: { type: "CANDLE_PATTERN", timeframe: "1d", pattern: "GREEN_CANDLE" },
      exit: { type: "TAKE_PROFIT_PCT", timeframe: "1d", value: 0.1 },
    },
  },
  {
    id: "rsi_pattern_combo",
    title: "RSI + bullish engulfing + SL/TP",
    description: "RSI filter, pattern trigger, bracket exit.",
    strategy_name: "rsi_pattern_combo",
    components: {
      setup: {
        type: "INDICATOR_THRESHOLD",
        timeframe: "1d",
        indicator: "RSI",
        operator: ">",
        value: 50,
      },
      trigger: { type: "CANDLE_PATTERN", timeframe: "1d", pattern: "BULLISH_ENGULFING" },
      exit: {
        type: "CONDITIONAL_OR_FIXED",
        timeframe: "1d",
        conditions: [
          { type: "STOP_LOSS_PCT", value: 0.05 },
          { type: "TAKE_PROFIT_PCT", value: 0.12 },
        ],
      },
    },
  },
  {
    id: "vegas_channel_short_term",
    title: "Vegas-style (EMA crossover)",
    description: "Short-term golden cross style on fast EMAs with bracket exit.",
    strategy_name: "vegas_channel_short_term",
    components: {
      setup: { type: "NONE", timeframe: "1d" },
      trigger: {
        type: "INDICATOR_CROSSOVER",
        timeframe: "1d",
        indicator1: "ema_8",
        indicator2: "ema_21",
        crossover_type: "GOLDEN_CROSS",
      },
      exit: {
        type: "CONDITIONAL_OR_FIXED",
        timeframe: "1d",
        conditions: [
          { type: "STOP_LOSS_PCT", value: 0.04 },
          { type: "TAKE_PROFIT_PCT", value: 0.15 },
        ],
      },
    },
  },
  {
    id: "price_break_time_exit",
    title: "Price breakout · time exit",
    description: "Enter on level break; flat after max holding days.",
    strategy_name: "price_break_time_exit",
    components: {
      setup: { type: "NONE", timeframe: "1d" },
      trigger: {
        type: "PRICE_CROSSOVER",
        timeframe: "1d",
        price_level: 400,
        direction: "ABOVE",
      },
      exit: { type: "TIME_BASED", timeframe: "1d", max_holding_days: 10 },
    },
  },
  {
    id: "golden_cross_sma",
    title: "Golden cross (50/200) · trailing stop",
    description: "Classic SMA crossover with trailing exit.",
    strategy_name: "golden_cross_sma",
    components: {
      setup: { type: "NONE", timeframe: "1d" },
      trigger: {
        type: "INDICATOR_CROSSOVER",
        timeframe: "1d",
        indicator1: "sma_50",
        indicator2: "sma_200",
        crossover_type: "GOLDEN_CROSS",
      },
      exit: { type: "TRAILING_STOP_PCT", timeframe: "1d", value: 0.03 },
    },
  },
];

export function getRecipeById(id: string): BacktestRecipe | undefined {
  return BACKTEST_RECIPES.find((r) => r.id === id);
}

export function cloneRecipeComponents(recipeId: string): StrategyComponents | null {
  const r = getRecipeById(recipeId);
  return r ? componentsFrom(r.components) : null;
}

export function applyTimeframeToComponents(parts: StrategyComponents, timeframe: string): StrategyComponents {
  return {
    setup: { ...parts.setup, timeframe },
    trigger: { ...parts.trigger, timeframe },
    exit: { ...parts.exit, timeframe },
  };
}

/** Suggested experiment slug from current blocks (fair A/B tweaks). */
export function suggestExperimentStrategyName(parts: StrategyComponents): string {
  const setup = parts.setup ?? {};
  const trigger = parts.trigger ?? {};
  const exitBlock = parts.exit ?? {};
  const setupType = String(setup.type ?? "x").toLowerCase();
  const trigType = String(trigger.type ?? "x").toLowerCase();
  const exitType = String(exitBlock.type ?? "x").toLowerCase();

  const seg: string[] = [];

  if (setupType === "indicator_threshold") {
    const ind = String(setup.indicator ?? "rsi").toLowerCase();
    const val = setup.value != null ? String(setup.value).replace(/\./g, "p") : "";
    seg.push(ind + val);
  } else seg.push(setupType === "none" ? "noop" : setupType.slice(0, 6));

  if (trigType === "candle_pattern") {
    seg.push(String(trigger.pattern ?? "pattern").toLowerCase().slice(0, 12));
  } else if (trigType === "indicator_crossover") {
    seg.push(
      `${String(trigger.indicator1 ?? "a").slice(0, 4)}_${String(trigger.indicator2 ?? "b").slice(0, 4)}_${
        String(trigger.crossover_type ?? "gc").toLowerCase() === "golden_cross" ? "gc" : "xc"
      }`,
    );
  } else if (trigType === "price_crossover") {
    seg.push(`px${trigger.price_level ?? 0}_${String(trigger.direction ?? "ab").slice(0, 2)}`.toLowerCase());
  } else seg.push(trigType.slice(0, 10));

  if (exitType === "conditional_or_fixed") {
    const conds = exitBlock.conditions;
    let sl = 0;
    let tp = 0;
    if (Array.isArray(conds)) {
      for (const c of conds) {
        if (c && typeof c === "object") {
          const o = c as { type?: string; value?: number };
          if (o.type === "STOP_LOSS_PCT") sl = Math.round(Number(o.value) * 100);
          if (o.type === "TAKE_PROFIT_PCT") tp = Math.round(Number(o.value) * 100);
        }
      }
    }
    seg.push(`sl${sl}tp${tp}`);
  } else if (exitType === "take_profit_pct") {
    seg.push(`tp${Math.round(Number(exitBlock.value) * 100)}`);
  } else if (exitType === "trailing_stop_pct") {
    seg.push(`trail${Math.round(Number(exitBlock.value) * 100)}`);
  } else if (exitType === "time_based") {
    seg.push(`d${exitBlock.max_holding_days ?? 0}`);
  } else seg.push(exitType.slice(0, 8));

  return `exp_${seg.join("_").replace(/[^a-z0-9_]+/gi, "_")}`;
}
