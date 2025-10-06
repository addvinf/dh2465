import { Button } from "../ui/Button";
import { Input } from "../ui/input";
import { Search, Download } from "lucide-react";
import { ViewToggle } from "./ViewToggle";
import type { ViewMode } from "../../types/personnel";

interface PersonnelTableHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onExport: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function PersonnelTableHeader({
  totalCount,
  filteredCount,
  searchTerm,
  onSearchChange,
  onExport,
  viewMode,
  onViewModeChange,
}: PersonnelTableHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg text-foreground">
          Personalregister ({filteredCount} av {totalCount})
        </h3>
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sök personal..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <ViewToggle
        currentView={viewMode}
        onViewChange={onViewModeChange}
        className="w-fit"
      />
    </div>
  );
}
