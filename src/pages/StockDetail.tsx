import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Placeholder data - will be replaced by backend
  const stockData = {
    symbol: symbol || "AAPL",
    name: "Apple Inc.",
    price: 178.45,
    change: 2.34,
    changePercent: 1.33,
    recommendationScore: user ? 87 : 72, // Higher score for logged-in users with strategy
    strategyName: user ? "Growth & Value Mix" : "Default Strategy",
    correlatedIndices: [
      { name: "S&P 500", correlation: 0.92, change: 1.2 },
      { name: "NASDAQ", correlation: 0.89, change: 1.5 },
      { name: "Technology", correlation: 0.85, change: 2.1 },
    ],
    fundamentals: {
      marketCap: "2.8T",
      peRatio: 29.5,
      dividendYield: "0.52%",
      week52High: 199.62,
      week52Low: 164.08,
      volume: "52.3M",
      avgVolume: "56.2M",
      eps: 6.05,
      revenue: "383.3B",
      profitMargin: "25.3%",
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-accent";
    return "text-muted-foreground";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Strong Buy";
    if (score >= 60) return "Buy";
    if (score >= 40) return "Hold";
    return "Sell";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Stock Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-display font-bold text-foreground">
                {stockData.symbol}
              </h1>
              <Badge variant="secondary" className="text-sm">
                {stockData.name}
              </Badge>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-foreground">
                ${stockData.price.toFixed(2)}
              </span>
              <span
                className={`flex items-center gap-1 text-lg font-semibold ${
                  stockData.change >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {stockData.change >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {stockData.change >= 0 ? "+" : ""}
                {stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Recommendation Score */}
          <Card className="mb-6 shadow-card border-border/50 animate-fade-in bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recommendation Score</span>
                {user && (
                  <Badge variant="outline" className="text-sm">
                    Based on: {stockData.strategyName}
                  </Badge>
                )}
                {!user && (
                  <Badge variant="outline" className="text-sm">
                    Sign in for personalized scores
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-5xl font-bold ${getScoreColor(stockData.recommendationScore)}`}>
                    {stockData.recommendationScore}
                  </span>
                  <span className={`text-2xl font-semibold ${getScoreColor(stockData.recommendationScore)}`}>
                    {getScoreLabel(stockData.recommendationScore)}
                  </span>
                </div>
                <Progress value={stockData.recommendationScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {user
                    ? "This score is calculated based on your personal investment strategy and risk preferences."
                    : "This is a default recommendation score. Sign in to get personalized recommendations based on your strategy."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Correlated Indices */}
          <Card className="mb-6 shadow-card border-border/50 animate-fade-in">
            <CardHeader>
              <CardTitle>Correlated Major Indices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockData.correlatedIndices.map((index) => (
                  <div
                    key={index.name}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{index.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Correlation: {(index.correlation * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={index.correlation * 100} className="w-24 h-2" />
                      <span
                        className={`text-sm font-semibold ${
                          index.change >= 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {index.change >= 0 ? "+" : ""}
                        {index.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fundamentals */}
          <Card className="shadow-card border-border/50 animate-fade-in">
            <CardHeader>
              <CardTitle>Key Fundamentals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${stockData.fundamentals.marketCap}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">P/E Ratio</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stockData.fundamentals.peRatio}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Dividend Yield</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stockData.fundamentals.dividendYield}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">EPS</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${stockData.fundamentals.eps}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">52W High</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${stockData.fundamentals.week52High}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">52W Low</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${stockData.fundamentals.week52Low}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Volume</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stockData.fundamentals.volume}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Avg Volume</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stockData.fundamentals.avgVolume}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Revenue</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${stockData.fundamentals.revenue}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Profit Margin</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stockData.fundamentals.profitMargin}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StockDetail;
