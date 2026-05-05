import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const MARKET_API_BASE_URL =
  import.meta.env.VITE_MARKET_API_BASE_URL ||
  "https://8p52xermu7.execute-api.ca-west-1.amazonaws.com/v1";
const MARKET_API_KEY =
  import.meta.env.VITE_MARKET_API_KEY || import.meta.env.VITE_SERVING_API_KEY || "";

interface QuoteResponse {
  data: { close?: string | number };
}

interface ReturnsResponse {
  data?: { returns?: Record<string, number | null> };
}

const QUOTE_SPECS: Array<{ name: string; symbol: string; isCurrency?: boolean }> = [
  { name: "S&P 500", symbol: "SPY" },
  { name: "NASDAQ", symbol: "QQQ" },
  { name: "DOW", symbol: "DJIA" },
  { name: "Gold", symbol: "GLD", isCurrency: true },
  { name: "Silver", symbol: "SLV", isCurrency: true },
  { name: "Oil", symbol: "USO", isCurrency: true },
];

function formatQuote(close: number | null, isCurrency?: boolean): string {
  if (close === null || !Number.isFinite(close)) return "—";
  return isCurrency ? `$${close.toFixed(2)}` : close.toFixed(2);
}

function formatChange(pct: number | null): { text: string; positive: boolean } {
  if (pct === null || !Number.isFinite(pct)) return { text: "—", positive: true };
  return {
    text: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
    positive: pct >= 0,
  };
}

interface Row {
  name: string;
  value: string;
  changeLabel: string;
  positive: boolean;
}

const MarketIndexToday = () => {
  const [rows, setRows] = useState<Row[]>(
    QUOTE_SPECS.map((s) => ({ name: s.name, value: "—", changeLabel: "…", positive: true }))
  );

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const headers: HeadersInit = {};
      if (MARKET_API_KEY) headers["x-api-key"] = MARKET_API_KEY;

      const next = await Promise.all(
        QUOTE_SPECS.map(async (spec) => {
          try {
            const [quoteRes, retRes] = await Promise.all([
              fetch(`${MARKET_API_BASE_URL}/market/quote/${spec.symbol}`, {
                headers,
                signal: controller.signal,
              }),
              fetch(`${MARKET_API_BASE_URL}/market/returns/${spec.symbol}?horizons=1`, {
                headers,
                signal: controller.signal,
              }),
            ]);

            if (!quoteRes.ok || !retRes.ok) {
              return {
                name: spec.name,
                value: "—",
                changeLabel: "N/A",
                positive: true,
              } satisfies Row;
            }

            const quoteJson = (await quoteRes.json()) as QuoteResponse;
            const retJson = (await retRes.json()) as ReturnsResponse;
            const close = Number(quoteJson.data?.close);
            const d1 = Number(retJson.data?.returns?.["1d"]);
            const ch = formatChange(Number.isFinite(d1) ? d1 : null);
            return {
              name: spec.name,
              value: formatQuote(Number.isFinite(close) ? close : null, spec.isCurrency),
              changeLabel: ch.text,
              positive: ch.positive,
            } satisfies Row;
          } catch {
            return {
              name: spec.name,
              value: "—",
              changeLabel: "N/A",
              positive: true,
            } satisfies Row;
          }
        })
      );

      setRows(next);
    };

    load();
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
      <span className="text-xs font-medium text-muted-foreground w-full sm:w-auto text-center sm:text-left">Live</span>
      {rows.map((idx) => (
        <div key={idx.name} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{idx.name}</span>
          <span className="text-sm font-mono font-medium">{idx.value}</span>
          <span
            className={`inline-flex items-center text-xs font-medium ${
              idx.changeLabel === "—" || idx.changeLabel === "N/A"
                ? "text-muted-foreground"
                : idx.positive
                  ? "text-green-600"
                  : "text-red-500"
            }`}
          >
            {idx.changeLabel !== "—" && idx.changeLabel !== "N/A" && idx.positive ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : idx.changeLabel !== "—" && idx.changeLabel !== "N/A" ? (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            ) : null}
            {idx.changeLabel}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MarketIndexToday;
