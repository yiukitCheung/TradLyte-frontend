import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Settings, Layers } from "lucide-react";
import { Condition } from "@/pages/StrategyBuilder";
import { useState } from "react";
import { toast } from "sonner";

interface StrategyCanvasProps {
  conditions: Condition[];
  onRemoveCondition: (id: string) => void;
  onAddCondition: (condition: Condition) => void;
}

const StrategyCanvas = ({ conditions, onRemoveCondition, onAddCondition }: StrategyCanvasProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const conditionData = e.dataTransfer.getData("condition");
    if (conditionData) {
      try {
        const condition = JSON.parse(conditionData);
        onAddCondition({ ...condition, id: `${condition.id}-${Date.now()}` });
        toast.success(`Added: ${condition.label}`);
      } catch (error) {
        console.error("Failed to parse condition data:", error);
      }
    }
  };

  return (
    <Card className="p-6 shadow-card min-h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Your Strategy</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 min-h-[500px] transition-all ${
          dragOver 
            ? "border-primary bg-primary/5" 
            : "border-border bg-muted/20"
        }`}
      >
        {conditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gradient-subtle flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Build Your Strategy
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Drag and drop conditions from the library or click on them to start building your investment strategy
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conditions.map((condition, index) => (
              <div
                key={condition.id}
                className="group relative animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary transition-all">
                  {/* Connection Line */}
                  {index > 0 && (
                    <div className="absolute -top-4 left-8 w-0.5 h-4 bg-border"></div>
                  )}
                  
                  {/* Step Number */}
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">{index + 1}</span>
                  </div>

                  {/* Condition Details */}
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{condition.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Category: <span className="capitalize">{condition.category}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      onClick={() => onRemoveCondition(condition.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StrategyCanvas;
