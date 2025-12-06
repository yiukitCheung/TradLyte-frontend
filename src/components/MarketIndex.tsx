import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const MarketIndex = () => {
  // Generate mock time series data - Tradlyte Pick outperforms S&P 500
  const generateChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let sp500 = 100, tradlyte = 100;
    
    return days.map((day, i) => {
      if (i > 0) {
        sp500 *= 1 + (Math.random() * 0.02 - 0.005);
        tradlyte *= 1 + (Math.random() * 0.02 + 0.008);
      }
      
      return {
        day,
        'S&P 500': parseFloat(sp500.toFixed(2)),
        'Tradlyte Pick': parseFloat(tradlyte.toFixed(2)),
      };
    });
  };

  const [chartData] = useState(generateChartData());
  
  const tradlyteReturn = ((chartData[chartData.length - 1]['Tradlyte Pick'] - 100)).toFixed(2);
  const sp500Return = ((chartData[chartData.length - 1]['S&P 500'] - 100)).toFixed(2);
  const outperformance = (parseFloat(tradlyteReturn) - parseFloat(sp500Return)).toFixed(2);

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl font-display">Tradlyte vs Market</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">7-day performance comparison</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tradlyte: <span className="text-primary font-semibold ml-1">+{tradlyteReturn}%</span>
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-3 border-primary/30 bg-primary/5">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
              +{outperformance}% vs S&P
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
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
              {/* Tradlyte Pick - emphasized primary color */}
              <Line
                type="monotone"
                dataKey="Tradlyte Pick"
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
            <span className="text-sm font-semibold text-foreground">Tradlyte Pick</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketIndex;
