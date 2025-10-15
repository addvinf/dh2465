import { useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { SalaryTypeListItem } from "./SalaryTypeListItem";
import type { SalaryTypeSearchResult } from "../../hooks/useSalaryTypeSearch";

interface SalaryTypePopupProps {
  isOpen: boolean;
  searchTerm: string;
  filteredSalaryTypes: SalaryTypeSearchResult[];
  selectedSalaryTypeText?: string;
  highlightedIndex: number;
  loading?: boolean;
  error?: string;
  position: {
    top: number;
    left: number;
    width: number;
  };
  onSalaryTypeSelect: (salaryType: SalaryTypeSearchResult) => void;
  onClose: () => void;
}

export function SalaryTypePopup({
  isOpen,
  searchTerm,
  filteredSalaryTypes,
  selectedSalaryTypeText,
  highlightedIndex,
  loading = false,
  error,
  position,
  onSalaryTypeSelect,
  onClose,
}: SalaryTypePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Delay to avoid immediate closure when opening
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && scrollContainerRef.current) {
      const item = scrollContainerRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (item) {
        item.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex]);

  if (!isOpen) return null;

  const showEmptyState = !loading && !error && filteredSalaryTypes.length === 0;
  const showResults = !loading && !error && filteredSalaryTypes.length > 0;

  return (
    <div
      ref={popupRef}
      data-salarytype-popup
      className="fixed z-[9999] bg-background border border-border rounded-md shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        minWidth: Math.max(position.width, 300),
        maxWidth: 400,
        pointerEvents: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">
            Lönearter
          </span>
          <span className="text-xs text-muted-foreground">
            ({filteredSalaryTypes.length} resultat)
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-border"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">Laddar...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {showEmptyState && (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">
              Inga lönearter hittades
            </span>
          </div>
        )}

        {showResults &&
          filteredSalaryTypes.map((salaryType, index) => (
            <SalaryTypeListItem
              key={salaryType.id}
              salaryType={salaryType}
              isSelected={salaryType.displayText === selectedSalaryTypeText}
              isHighlighted={index === highlightedIndex}
              searchTerm={searchTerm}
              onClick={onSalaryTypeSelect}
            />
          ))}
      </div>

      {/* Footer */}
      {showResults && (
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Använd ↑↓ för att navigera, Enter för att välja
          </span>
        </div>
      )}
    </div>
  );
}