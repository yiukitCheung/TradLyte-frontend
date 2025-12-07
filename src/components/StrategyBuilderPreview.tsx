import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Sparkles, RotateCcw, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import ConditionLibrary from "@/components/strategy-builder/ConditionLibrary";
import StrategyCanvas from "@/components/strategy-builder/StrategyCanvas";
import PerformanceChart from "@/components/strategy-builder/PerformanceChart";
import { Condition } from "@/pages/StrategyBuilder";

interface StrategyBuilderPreviewProps {
  isAuthenticated: boolean;
}

const StrategyBuilderPreview = ({ isAuthenticated }: StrategyBuilderPreviewProps) => {
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [activeTab, setActiveTab] = useState<"entry" | "exit">("entry");

  const handleDrop = (condition: Condition) => {
    // Limit to 2 conditions for non-authenticated users
    if (!isAuthenticated && selectedConditions.length >= 2) {
      return;
    }
    setSelectedConditions([...selectedConditions, { ...condition, id: `${condition.type}-${Date.now()}` }]);
  };

  const handleRemoveCondition = (id: string) => {
    setSelectedConditions(selectedConditions.filter(c => c.id !== id));
  };

  const handleReset = () => {
    setSelectedConditions([]);
  };

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {!isAuthenticated && (
          <Card className="p-4 bg-primary/5 border-primary/20 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Preview Mode:</span> Try up to 2 conditions. Sign in for full access.
                </p>
              </div>
              <Link to="/auth">
                <Button size="sm">
                  Sign In <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            disabled={selectedConditions.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          {isAuthenticated ? (
            <Link to="/strategy-builder">
              <Button size="sm">
                Open Full Builder <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" disabled>
              <Lock className="h-4 w-4 mr-1" />
              Save Strategy
            </Button>
          )}
        </div>
      </div>

      {/* Performance Chart - Hero Section */}
      <PerformanceChart isSimulating={false} conditions={selectedConditions} />

      {/* Building Tools - Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Library */}
        <Card className="p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-subtle flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Condition Library
          </h2>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "entry" | "exit")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="entry" className="text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Entry (Buy)
              </TabsTrigger>
              <TabsTrigger value="exit" className="text-xs flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Exit (Sell)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="mt-0">
              <ConditionLibrary category="entry" onDrop={handleDrop} />
            </TabsContent>

            <TabsContent value="exit" className="mt-0">
              <ConditionLibrary category="exit" onDrop={handleDrop} />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Strategy Canvas */}
        <StrategyCanvas 
          conditions={selectedConditions}
          onRemoveCondition={handleRemoveCondition}
          onAddCondition={(condition) => {
            if (!isAuthenticated && selectedConditions.length >= 2) {
              return;
            }
            setSelectedConditions([...selectedConditions, condition]);
          }}
        />
      </div>
    </div>
  );
};

export default StrategyBuilderPreview;