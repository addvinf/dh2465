import { Button } from "../ui/Button";
import { User, CreditCard } from "lucide-react";
import type { ViewMode } from "../../types/personnel";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  className,
}: ViewToggleProps) {
  return (
    <div
      className={`flex items-center rounded-lg border border-border bg-muted p-1 ${className}`}
    >
      <Button
        size="sm"
        variant={currentView === "personal" ? "default" : "ghost"}
        onClick={() => onViewChange("personal")}
        className={`h-8 px-3 ${
          currentView === "personal"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="mr-2 h-4 w-4" />
        Personinfo
      </Button>
      <Button
        size="sm"
        variant={currentView === "financial" ? "default" : "ghost"}
        onClick={() => onViewChange("financial")}
        className={`h-8 px-3 ${
          currentView === "financial"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Ekonomiinfo
      </Button>
    </div>
  );
}
