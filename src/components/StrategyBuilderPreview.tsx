import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ConditionLibrary from "@/components/strategy-builder/ConditionLibrary";
import StrategyCanvas from "@/components/strategy-builder/StrategyCanvas";
import { Condition } from "@/pages/StrategyBuilder";

interface StrategyBuilderPreviewProps {
  isAuthenticated: boolean;
}

const StrategyBuilderPreview = ({ isAuthenticated }: StrategyBuilderPreviewProps) => {
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [activeTab, setActiveTab] = useState<"beginner" | "intermediate" | "advanced">("beginner");

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
      {!isAuthenticated && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Limited Preview Mode
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You can build strategies with up to 2 conditions. Sign in to unlock unlimited conditions, save strategies, and run backtests.
              </p>
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Sign In to Unlock Full Features
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Condition Library */}
        <Card className="p-6 shadow-card">
          <h2 className="text-xl font-semibold text-foreground mb-4">Condition Library</h2>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="beginner">Basic</TabsTrigger>
              <TabsTrigger value="intermediate" disabled={!isAuthenticated}>
                <div className="flex items-center gap-1">
                  Advanced
                  {!isAuthenticated && <Lock className="h-3 w-3" />}
                </div>
              </TabsTrigger>
              <TabsTrigger value="advanced" disabled={!isAuthenticated}>
                <div className="flex items-center gap-1">
                  Pro
                  {!isAuthenticated && <Lock className="h-3 w-3" />}
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="beginner" className="mt-0">
              <ConditionLibrary category="beginner" onDrop={handleDrop} />
            </TabsContent>

            {isAuthenticated && (
              <>
                <TabsContent value="intermediate" className="mt-0">
                  <ConditionLibrary category="intermediate" onDrop={handleDrop} />
                </TabsContent>

                <TabsContent value="advanced" className="mt-0">
                  <ConditionLibrary category="advanced" onDrop={handleDrop} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </Card>

        {/* Strategy Canvas */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={selectedConditions.length === 0}
              >
                Reset
              </Button>
              {isAuthenticated ? (
                <Link to="/strategy-builder">
                  <Button>
                    Open Full Builder
                  </Button>
                </Link>
              ) : (
                <Button disabled>
                  <Lock className="h-4 w-4 mr-2" />
                  Save Strategy (Sign in required)
                </Button>
              )}
            </div>

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
      </div>
    </div>
  );
};

export default StrategyBuilderPreview;
