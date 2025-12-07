import { TrendingUp, TrendingDown, DollarSign, Calendar, Shield, Target, Zap, Brain, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Condition } from "@/pages/StrategyBuilder";

interface ConditionLibraryProps {
  category: "entry" | "exit";
  onDrop: (condition: Condition) => void;
}

const conditionsByCategory = {
  entry: [
    { id: "buy-dip", type: "buy-dip", label: "Buy the Dip", icon: TrendingDown, description: "Buy when price drops X%" },
    { id: "dollar-cost", type: "dollar-cost", label: "Dollar Cost Average", icon: DollarSign, description: "Regular scheduled buys" },
    { id: "momentum-buy", type: "momentum-buy", label: "Momentum Entry", icon: TrendingUp, description: "Buy on upward trend" },
    { id: "rsi-oversold", type: "rsi-oversold", label: "RSI Oversold", icon: Brain, description: "Buy when RSI < 30" },
    { id: "macd-bullish", type: "macd-bullish", label: "MACD Bullish Cross", icon: Zap, description: "Buy on MACD crossover" },
    { id: "support-bounce", type: "support-bounce", label: "Support Bounce", icon: ArrowUpCircle, description: "Buy at support level" },
  ],
  exit: [
    { id: "take-profit", type: "take-profit", label: "Take Profit", icon: TrendingUp, description: "Sell at profit target %" },
    { id: "stop-loss", type: "stop-loss", label: "Stop Loss", icon: Shield, description: "Sell to limit losses" },
    { id: "trailing-stop", type: "trailing-stop", label: "Trailing Stop", icon: Target, description: "Dynamic stop follows price" },
    { id: "hold-period", type: "hold-period", label: "Time-Based Exit", icon: Calendar, description: "Sell after X days/months" },
    { id: "rsi-overbought", type: "rsi-overbought", label: "RSI Overbought", icon: Brain, description: "Sell when RSI > 70" },
    { id: "resistance-hit", type: "resistance-hit", label: "Resistance Hit", icon: ArrowDownCircle, description: "Sell at resistance level" },
  ],
};

const ConditionLibrary = ({ category, onDrop }: ConditionLibraryProps) => {
  const conditions = conditionsByCategory[category];

  const handleDragStart = (e: React.DragEvent, condition: any) => {
    e.dataTransfer.setData("condition", JSON.stringify({ ...condition, category }));
  };

  return (
    <div className="space-y-3">
      {conditions.map((condition) => {
        const Icon = condition.icon;
        return (
          <div
            key={condition.id}
            draggable
            onDragStart={(e) => handleDragStart(e, condition)}
            className="group"
          >
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto p-4 hover:border-primary hover:bg-primary/5 transition-all cursor-move"
              onClick={() => onDrop({ ...condition, category })}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                  category === "entry" 
                    ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{condition.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{condition.description}</div>
                </div>
              </div>
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default ConditionLibrary;
