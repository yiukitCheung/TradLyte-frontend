import type { PrebuiltStrategyId } from "@/components/strategy-builder/PrebuiltStrategyCard";

/** Rule shape from API guide smoke test; nested timeframes follow the selected interval. */
function buildKnownGoodComponents(timeframe: string) {
  return {
    setup: { type: "NONE", timeframe },
    trigger: { type: "CANDLE_PATTERN", timeframe, pattern: "GREEN_CANDLE" },
    exit: { type: "TAKE_PROFIT_PCT", timeframe, value: 0.1 },
  };
}

const STRATEGY_NAME_BY_PREBUILT: Record<PrebuiltStrategyId, string> = {
  "vegas-channel": "vegas_channel_prebuilt",
  "golden-cross": "golden_cross_prebuilt",
};

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
  return {
    strategy_name: STRATEGY_NAME_BY_PREBUILT[prebuiltId],
    symbol: opts.symbol.trim().toUpperCase(),
    timeframe: opts.timeframe,
    start_date: opts.start_date.trim(),
    end_date: opts.end_date.trim(),
    initial_capital: opts.initial_capital,
    components: buildKnownGoodComponents(opts.timeframe),
  };
}
