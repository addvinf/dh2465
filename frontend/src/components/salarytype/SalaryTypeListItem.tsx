import { DollarSign } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SalaryTypeSearchResult } from "../../hooks/useSalaryTypeSearch";

interface SalaryTypeListItemProps {
  salaryType: SalaryTypeSearchResult;
  isSelected?: boolean;
  isHighlighted?: boolean;
  searchTerm?: string;
  onClick: (salaryType: SalaryTypeSearchResult) => void;
}

export function SalaryTypeListItem({
  salaryType,
  isSelected = false,
  isHighlighted = false,
  searchTerm = "",
  onClick,
}: SalaryTypeListItemProps) {
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
      onClick={() => onClick(salaryType)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <DollarSign className="h-4 w-4 text-foreground opacity-70" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-tight">
            {highlightMatch(salaryType.displayText, searchTerm)}
          </div>

          <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Kod: {salaryType.code}
          </div>
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