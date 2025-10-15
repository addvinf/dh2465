import { Building2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CostCenterSearchResult } from "../../hooks/useCostCenterSearch";

interface CostCenterListItemProps {
  costCenter: CostCenterSearchResult;
  isSelected?: boolean;
  isHighlighted?: boolean;
  searchTerm?: string;
  onClick: (costCenter: CostCenterSearchResult) => void;
}

export function CostCenterListItem({
  costCenter,
  isSelected = false,
  isHighlighted = false,
  searchTerm = "",
  onClick,
}: CostCenterListItemProps) {
  // Highlight matching text
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;

    const normalizedSearch = search.toLowerCase();
    const normalizedText = text.toLowerCase();
    const index = normalizedText.indexOf(normalizedSearch);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-800 text-foreground font-medium">
          {text.slice(index, index + search.length)}
        </span>
        {text.slice(index + search.length)}
      </>
    );
  };

  return (
    <div
      className={cn(
        "px-3 py-2 cursor-pointer transition-colors duration-150 border-b border-border/30 last:border-0 group",
        isSelected && "bg-primary/10 border-primary/20",
        isHighlighted && "bg-accent",
        !isSelected && !isHighlighted && "hover:bg-muted/50"
      )}
      onClick={() => onClick(costCenter)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Building2 className="h-4 w-4 text-foreground opacity-70" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-tight">
            {highlightMatch(costCenter.displayText, searchTerm)}
          </div>

          {costCenter.description && (
            <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
              {highlightMatch(costCenter.description, searchTerm)}
            </div>
          )}
        </div>

        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
