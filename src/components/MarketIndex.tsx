import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles, User } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface MarketIndexProps {
  variant?: 'default' | 'user';
}

const MarketIndex = ({ variant = 'default' }: MarketIndexProps) => {
  const isUserMode = variant === 'user';
  const primaryLabel = isUserMode ? 'Your Portfolio' : 'Tradlyte Pick';
  
  // Generate 3 years of monthly data
  const generateChartData = () => {
    const data = [];
    let sp500 = 100, primary = 100;
    const startDate = new Date(2022, 0); // Jan 2022
    
    for (let i = 0; i < 36; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (i > 0) {
        sp500 *= 1 + (Math.random() * 0.06 - 0.02);
        primary *= 1 + (Math.random() * 0.05 + 0.01);
      }
      
      data.push({
        month: label,
        'S&P 500': parseFloat(sp500.toFixed(2)),
        [primaryLabel]: parseFloat(primary.toFixed(2)),
      });
    }
    return data;
  };

  const [chartData] = useState(generateChartData());
  
  const primaryReturn = ((chartData[chartData.length - 1][primaryLabel] - 100)).toFixed(1);
  const sp500Return = ((chartData[chartData.length - 1]['S&P 500'] - 100)).toFixed(1);
  const outperformance = (parseFloat(primaryReturn) - parseFloat(sp500Return)).toFixed(1);

  return (
    <Card className="shadow-card border-border/50 animate-fade-in h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl font-display">
              {isUserMode ? 'Your Growth vs Market' : 'Tradlyte vs Market'}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">3-year performance comparison</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              {isUserMode ? <User className="w-3.5 h-3.5 mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              {isUserMode ? 'You' : 'Tradlyte'}: <span className="text-primary font-semibold ml-1">+{primaryReturn}%</span>
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-3 border-primary/30 bg-primary/5">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
              +{outperformance}% vs S&P
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={5}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                domain={[98, 'auto']}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)'
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}%`,
                  name
                ]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              {/* S&P 500 - muted gray */}
              <Line
                type="monotone"
                dataKey="S&P 500"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                strokeOpacity={0.6}
              />
              {/* Primary line - emphasized primary color */}
              <Line
                type="monotone"
                dataKey={primaryLabel}
                stroke="hsl(var(--primary))"
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Simple Legend */}
        <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 rounded-full bg-muted-foreground opacity-60" />
            <span className="text-sm text-muted-foreground">S&P 500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-foreground">{primaryLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketIndex;
