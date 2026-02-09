import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getUserPurpose } from "@/lib/purposeUtils";

interface PortfolioItem {
  purchase_price: number | null;
  current_price: number | null;
  quantity: number | null;
  created_at: string | null;
}

const GrowthChart = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalAmount, setGoalAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('user_portfolio')
          .select('purchase_price, current_price, quantity, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (portfolioError) throw portfolioError;
        setPortfolioItems(portfolioData || []);

        // Fetch first goal amount from user_goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('target_amount')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!goalsError && goalsData?.target_amount) {
          setGoalAmount(parseFloat(goalsData.target_amount.toString()));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Generate chart data based on portfolio growth over time
  const generateChartData = () => {
    if (portfolioItems.length === 0) return [];

    const data = [];
    let cumulativeValue = 0;
    const startDate = portfolioItems[0]?.created_at 
      ? new Date(portfolioItems[0].created_at) 
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago if no date

    // Generate monthly data points
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Calculate cumulative value up to this point
      const itemsUpToDate = portfolioItems.filter(item => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate <= date;
      });

      cumulativeValue = itemsUpToDate.reduce((sum, item) => {
        if (item.purchase_price && item.current_price && item.quantity) {
          const currentValue = item.current_price * item.quantity;
          return sum + currentValue;
        }
        return sum;
      }, 0);

      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: cumulativeValue,
      });
    }

    return data;
  };

  const chartData = generateChartData();
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  if (loading) {
    return (
      <Card className="shadow-card border-border/50">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <Card className="shadow-card border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Growth Chart
          </CardTitle>
          <CardDescription>Your portfolio growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add stocks to your portfolio to see your growth trajectory
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Growth Chart
        </CardTitle>
        <CardDescription>
          Your portfolio value over time
          {goalAmount && (
            <span className="ml-2 text-primary font-medium">
              • Goal: ${goalAmount.toLocaleString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
              />
              {goalAmount && (
                <ReferenceLine 
                  y={goalAmount} 
                  stroke="hsl(var(--accent))" 
                  strokeDasharray="5 5"
                  label={{ value: "Your Goal", position: "right", fill: "hsl(var(--accent))" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {goalAmount && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Value</span>
              <span className="font-semibold">${currentValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Goal Amount</span>
              <span className="font-semibold text-accent">${goalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-semibold ${goalAmount - currentValue > 0 ? 'text-primary' : 'text-green-600'}`}>
                ${Math.abs(goalAmount - currentValue).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GrowthChart;
