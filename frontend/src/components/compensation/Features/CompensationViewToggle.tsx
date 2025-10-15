import { Users, Table as TableIcon } from "lucide-react";
import { Button } from "../../ui/Button";
import type { CompensationViewMode } from "../../../types/compensation";

interface CompensationViewToggleProps {
  viewMode: CompensationViewMode;
  onViewModeChange: (mode: CompensationViewMode) => void;
}

export function CompensationViewToggle({
  viewMode,
  onViewModeChange,
}: CompensationViewToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
      <Button
        variant={viewMode === "person" ? "outline" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("person")}
        className="flex items-center space-x-2"
      >
        <Users className="h-4 w-4" />
        <span>Per person</span>
      </Button>
      <Button
        variant={viewMode === "compensation" ? "outline" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("compensation")}
        className="flex items-center space-x-2"
      >
        <TableIcon className="h-4 w-4" />
        <span>Per ersättning</span>
      </Button>
    </div>
  );
}
