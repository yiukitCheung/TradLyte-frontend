import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PortfolioItem {
  id: string;
  asset_name: string;
  purchase_price: number | null;
  current_price: number | null;
  quantity: number | null;
}

const EntryPriceGrowth = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_portfolio')
          .select('id, asset_name, purchase_price, current_price, quantity')
          .eq('user_id', user.id);

        if (error) throw error;
        setPortfolioItems(data || []);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  const calculateEntryBasedGrowth = () => {
    let totalGain = 0;
    let totalInvested = 0;

    portfolioItems.forEach((item) => {
      if (item.purchase_price && item.current_price && item.quantity) {
        const invested = item.purchase_price * item.quantity;
        const currentValue = item.current_price * item.quantity;
        const gain = currentValue - invested;
        
        totalInvested += invested;
        totalGain += gain;
      }
    });

    return {
      totalGain,
      totalInvested,
      gainPercent: totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0,
    };
  };

  const { totalGain, totalInvested, gainPercent } = calculateEntryBasedGrowth();

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
            <DollarSign className="h-5 w-5 text-primary" />
            Your Growth
          </CardTitle>
          <CardDescription>Based on your entry prices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add stocks to your portfolio to see your entry-price-based growth
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
          Your Growth
        </CardTitle>
        <CardDescription>Based on your entry prices, not market metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {totalGain >= 0 ? '+' : ''}${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground">
              From your entry prices
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
              <p className="text-lg font-semibold">${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gain %</p>
              <p className={`text-lg font-semibold ${gainPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryPriceGrowth;
