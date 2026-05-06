import type { PrebuiltStrategyId } from "@/components/strategy-builder/PrebuiltStrategyCard";

/**
 * Vegas Channel — validated smoke-style rules from API guide (simple candle + fixed take-profit).
 * Swap when your backtester exposes real channel/EMA rule types.
 */
function buildVegasComponents(timeframe: string) {
  return {
    setup: { type: "NONE", timeframe },
    trigger: { type: "CANDLE_PATTERN", timeframe, pattern: "GREEN_CANDLE" },
    exit: { type: "TAKE_PROFIT_PCT", timeframe, value: 0.1 },
  };
}

/**
 * Golden Cross — uses the richer example from API guide (`Momentum_Swing`-style components).
 * This is not a literal MA(50)/MA(200) crossover until the API adds that construct; it does produce
 * different signals than {@link buildVegasComponents} so results should diverge.
 */
function buildGoldenCrossComponents(timeframe: string) {
  return {
    setup: {
      type: "INDICATOR_THRESHOLD",
      timeframe,
      indicator: "RSI",
      operator: ">",
      value: 50,
    },
    trigger: {
      type: "CANDLE_PATTERN",
      timeframe,
      pattern: "BULLISH_ENGULFING",
    },
    exit: {
      type: "CONDITIONAL_OR_FIXED",
      timeframe,
      conditions: [
        { type: "STOP_LOSS_PCT", value: 0.05 },
        { type: "TAKE_PROFIT_PCT", value: 0.12 },
      ],
    },
  };
}

/** Must match backend keys (e.g. nested result under `vegas_channel_short_term`). */
const STRATEGY_NAME_BY_PREBUILT: Record<PrebuiltStrategyId, string> = {
  "vegas-channel": "vegas_channel_short_term",
  "golden-cross": "golden_cross",
};

export function getBackendStrategyName(prebuiltId: PrebuiltStrategyId): string {
  return STRATEGY_NAME_BY_PREBUILT[prebuiltId];
}

export interface BacktestRequestOptions {
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
}

export function buildPrebuiltBacktestBody(
  prebuiltId: PrebuiltStrategyId,
  opts: BacktestRequestOptions
): Record<string, unknown> {
  const components =
    prebuiltId === "golden-cross"
      ? buildGoldenCrossComponents(opts.timeframe)
      : buildVegasComponents(opts.timeframe);

  return {
    strategy_name: STRATEGY_NAME_BY_PREBUILT[prebuiltId],
    symbol: opts.symbol.trim().toUpperCase(),
    timeframe: opts.timeframe,
    start_date: opts.start_date.trim(),
    end_date: opts.end_date.trim(),
    initial_capital: opts.initial_capital,
    components,
  };
}
