import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save, RotateCcw, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import ConditionLibrary from "@/components/strategy-builder/ConditionLibrary";
import StrategyCanvas from "@/components/strategy-builder/StrategyCanvas";
import PerformanceChart from "@/components/strategy-builder/PerformanceChart";
import { toast } from "sonner";

export interface Condition {
  id: string;
  type: string;
  label: string;
  category: "beginner" | "intermediate" | "advanced";
  parameters?: Record<string, any>;
}

const StrategyBuilder = () => {
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleDrop = (condition: Condition) => {
    setSelectedConditions([...selectedConditions, { ...condition, id: `${condition.id}-${Date.now()}` }]);
    toast.success(`Added: ${condition.label}`);
  };

  const handleRemoveCondition = (id: string) => {
    setSelectedConditions(selectedConditions.filter(c => c.id !== id));
    toast.info("Condition removed");
  };

  const handleSimulate = () => {
    if (selectedConditions.length === 0) {
      toast.error("Add at least one condition to simulate");
      return;
    }
    setIsSimulating(true);
    toast.success("Running simulation...");
    setTimeout(() => {
      setIsSimulating(false);
      toast.success("Simulation complete!");
    }, 2000);
  };

  const handleReset = () => {
    setSelectedConditions([]);
    toast.info("Strategy reset");
  };

  const handleSave = () => {
    toast.success("Strategy saved!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground">Strategy Builder</h1>
              <p className="text-muted-foreground">Design and test your investment strategies in a sandbox environment</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSimulate} 
              disabled={isSimulating}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4 mr-2" />
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </Button>
            <Button onClick={handleSave} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Strategy
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Condition Library - Left Sidebar */}
          <div className="lg:col-span-3">
            <Card className="p-6 shadow-card sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Condition Library</h2>
              <Tabs defaultValue="beginner" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="beginner">Beginner</TabsTrigger>
                  <TabsTrigger value="intermediate">Inter.</TabsTrigger>
                  <TabsTrigger value="advanced">Adv.</TabsTrigger>
                </TabsList>
                <TabsContent value="beginner">
                  <ConditionLibrary category="beginner" onDrop={handleDrop} />
                </TabsContent>
                <TabsContent value="intermediate">
                  <ConditionLibrary category="intermediate" onDrop={handleDrop} />
                </TabsContent>
                <TabsContent value="advanced">
                  <ConditionLibrary category="advanced" onDrop={handleDrop} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Strategy Canvas - Middle */}
          <div className="lg:col-span-5">
            <StrategyCanvas 
              conditions={selectedConditions}
              onRemoveCondition={handleRemoveCondition}
              onAddCondition={(condition) => setSelectedConditions([...selectedConditions, condition])}
            />
          </div>

          {/* Performance Chart - Right */}
          <div className="lg:col-span-4">
            <PerformanceChart isSimulating={isSimulating} conditions={selectedConditions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;
