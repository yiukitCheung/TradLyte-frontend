import type { BacktestResultShape } from "@/components/strategy-builder/PerformanceChart";

function asNum(x: unknown): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "") {
    const n = Number(x);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** True if the value is a finite number or a parseable numeric string (JSON sometimes stringifies decimals). */
function isMetricScalar(x: unknown): boolean {
  if (typeof x === "number" && Number.isFinite(x)) return true;
  if (typeof x === "string") {
    const t = x.trim();
    if (t === "") return false;
    const n = Number(t);
    return Number.isFinite(n);
  }
  return false;
}

function extractTradeRows(raw: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const rows = raw.filter(
    (row): row is Record<string, unknown> =>
      row != null && typeof row === "object" && !Array.isArray(row),
  );
  return rows.length ? rows : undefined;
}

function mapMetrics(o: Record<string, unknown>): BacktestResultShape {
  const curve = o.equity_curve;
  const curveDatesRaw = o.equity_curve_dates;
  const equity_curve_dates = Array.isArray(curveDatesRaw)
    ? curveDatesRaw.filter((x): x is string => typeof x === "string")
    : undefined;
  return {
    total_return_pct: asNum(o.total_return_pct),
    sharpe_ratio: asNum(o.sharpe_ratio),
    max_drawdown_pct: asNum(o.max_drawdown_pct),
    equity_curve: Array.isArray(curve) ? (curve as number[]) : undefined,
    equity_curve_dates: equity_curve_dates?.length ? equity_curve_dates : undefined,
    total_trades: asNum(o.total_trades),
    win_rate: asNum(o.win_rate),
    final_capital: asNum(o.final_capital),
    first_trade: o.first_trade as BacktestResultShape["first_trade"],
    last_trade: o.last_trade as BacktestResultShape["last_trade"],
    trades: extractTradeRows(o.trades),
  };
}

function looksLikeMetricBundle(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  return (
    isMetricScalar(r.total_return_pct) ||
    isMetricScalar(r.final_capital) ||
    isMetricScalar(r.total_trades) ||
    isMetricScalar(r.sharpe_ratio)
  );
}

/**
 * Supports:
 * - Flat `{ total_return_pct, equity_curve, ... }` (API guide style)
 * - Nested `{ vegas_channel_short_term: { ...metrics } }` (multi-strategy envelope)
 *
 * Some APIs put a **summary row** at the root (`total_return_pct`, etc.) *and* per-strategy
 * objects as nested keys. We must **not** map the root first in that case, or the UI shows
 * the wrong summary (e.g. +1.8% instead of the nested Vegas block ~+67%).
 */
export function normalizeBacktestResponse(
  rawData: unknown,
  preferredStrategyKey?: string
): BacktestResultShape | null {
  if (rawData == null || typeof rawData !== "object") return null;
  const root = rawData as Record<string, unknown>;

  // 1) Requested strategy block first (before flat root — avoids wrong top-level summary).
  if (preferredStrategyKey && preferredStrategyKey in root) {
    const inner = root[preferredStrategyKey];
    if (looksLikeMetricBundle(inner)) return mapMetrics(inner as Record<string, unknown>);
  }

  // 2) Any other nested metric bundle (multi-strategy payload).
  for (const k of Object.keys(root)) {
    if (preferredStrategyKey && k === preferredStrategyKey) continue;
    const inner = root[k];
    if (looksLikeMetricBundle(inner)) {
      return mapMetrics(inner as Record<string, unknown>);
    }
  }

  // 3) Single flat payload (smoke / guide style).
  if (looksLikeMetricBundle(root)) {
    return mapMetrics(root);
  }

  return null;
}
