import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

// Helper function to get computed color from CSS variable
const getComputedColor = (cssVar: string): string => {
  if (typeof window === 'undefined') return cssVar;
  const root = document.documentElement;
  const hslValue = getComputedStyle(root).getPropertyValue(cssVar.replace('hsl(var(', '').replace('))', ''));
  return hslValue ? `hsl(${hslValue})` : cssVar;
};

const MarketIndex = () => {
  const [colors, setColors] = useState({
    primary: 'hsl(12 76% 61%)',
    chart1: 'hsl(200 70% 50%)',
    chart2: 'hsl(150 60% 45%)',
    chart3: 'hsl(280 65% 60%)',
    muted: 'hsl(30 20% 70%)',
  });

  useEffect(() => {
    setColors({
      primary: getComputedColor('hsl(var(--primary))'),
      chart1: getComputedColor('hsl(var(--chart-1))'),
      chart2: getComputedColor('hsl(var(--chart-2))'),
      chart3: getComputedColor('hsl(var(--chart-3))'),
      muted: getComputedColor('hsl(var(--muted-foreground))'),
    });
  }, []);

  // Generate mock time series data - Tradlyte Pick outperforms
  const generateChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Starting at 100, simulate daily returns
    let sp500 = 100, nasdaq = 100, dow = 100, tradlyte = 100;
    
    return days.map((day, i) => {
      if (i > 0) {
        // Market indices have modest returns with some volatility
        sp500 *= 1 + (Math.random() * 0.02 - 0.005);
        nasdaq *= 1 + (Math.random() * 0.025 - 0.008);
        dow *= 1 + (Math.random() * 0.015 - 0.004);
        // Tradlyte Pick consistently outperforms
        tradlyte *= 1 + (Math.random() * 0.02 + 0.005);
      }
      
      return {
        day,
        'S&P 500': parseFloat(sp500.toFixed(2)),
        'NASDAQ': parseFloat(nasdaq.toFixed(2)),
        'Dow Jones': parseFloat(dow.toFixed(2)),
        'Tradlyte Pick': parseFloat(tradlyte.toFixed(2)),
      };
    });
  };

  const [chartData] = useState(generateChartData());
  
  // Calculate performance stats
  const tradlyteReturn = ((chartData[chartData.length - 1]['Tradlyte Pick'] - 100)).toFixed(2);
  const sp500Return = ((chartData[chartData.length - 1]['S&P 500'] - 100)).toFixed(2);
  const outperformance = (parseFloat(tradlyteReturn) - parseFloat(sp500Return)).toFixed(2);

  const indices = [
    { id: 'S&P 500', color: colors.chart1 },
    { id: 'NASDAQ', color: colors.chart2 },
    { id: 'Dow Jones', color: colors.chart3 },
    { id: 'Tradlyte Pick', color: colors.primary },
  ];

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl font-display">Market vs Tradlyte</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">7-day performance comparison</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tradlyte Pick: <span className="text-primary font-semibold ml-1">+{tradlyteReturn}%</span>
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-3 border-primary/30 bg-primary/5">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Outperforms by <span className="text-primary font-semibold ml-1">+{outperformance}%</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Chart */}
        <div className="h-[350px] w-full">
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
                formatter={(value: any, name: string) => [
                  `${value.toFixed(2)}%`,
                  name
                ]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => (
                  <span className={value === 'Tradlyte Pick' ? 'font-semibold' : ''}>
                    {value}
                  </span>
                )}
              />
              {/* Market indices - thinner lines */}
              {indices.filter(i => i.id !== 'Tradlyte Pick').map(index => (
                <Line
                  key={index.id}
                  type="monotone"
                  dataKey={index.id}
                  stroke={index.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={800}
                  strokeOpacity={0.7}
                />
              ))}
              {/* Tradlyte Pick - emphasized */}
              <Line
                type="monotone"
                dataKey="Tradlyte Pick"
                stroke={colors.primary}
                strokeWidth={3.5}
                dot={false}
                activeDot={{ r: 6, fill: colors.primary }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Simple Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/50">
          {indices.map(index => (
            <div key={index.id} className="flex items-center gap-2">
              <div 
                className={`h-1 rounded-full ${index.id === 'Tradlyte Pick' ? 'w-6' : 'w-4'}`}
                style={{ backgroundColor: index.color, opacity: index.id === 'Tradlyte Pick' ? 1 : 0.7 }}
              />
              <span className={`text-sm ${index.id === 'Tradlyte Pick' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {index.id}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketIndex;
