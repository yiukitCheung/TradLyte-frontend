import { TrendingUp, TrendingDown } from "lucide-react";

const indices = [
  { name: "S&P 500", value: "5,234", change: 0.42 },
  { name: "NASDAQ", value: "16,842", change: 0.58 },
  { name: "DOW", value: "39,125", change: -0.12 },
];

const MarketIndexToday = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
      <span className="text-xs font-medium text-muted-foreground">Today</span>
      {indices.map((idx) => (
        <div key={idx.name} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{idx.name}</span>
          <span className="text-sm font-mono font-medium">{idx.value}</span>
          <span
            className={`inline-flex items-center text-xs font-medium ${
              idx.change >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {idx.change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            )}
            {idx.change >= 0 ? "+" : ""}
            {idx.change}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default MarketIndexToday;
