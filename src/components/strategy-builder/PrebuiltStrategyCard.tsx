import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Check } from "lucide-react";

export type PrebuiltStrategyId = "vegas-channel" | "golden-cross";

interface PrebuiltStrategyCardProps {
  id: PrebuiltStrategyId;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const PrebuiltStrategyCard = ({
  id,
  title,
  description,
  selected,
  onSelect,
}: PrebuiltStrategyCardProps) => {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all border-2 hover:border-primary/50 ${
        selected ? "border-primary bg-primary/5" : "border-border"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-subtle flex items-center justify-center flex-shrink-0">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {selected && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={selected ? "default" : "outline"}
        className="mt-3 w-full"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {selected ? "Selected" : "Use this strategy"}
      </Button>
    </Card>
  );
};

export default PrebuiltStrategyCard;
