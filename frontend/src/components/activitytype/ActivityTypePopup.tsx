import { useRef, useEffect } from "react";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { ActivityTypeListItem } from "./ActivityTypeListItem";
import type { ActivityTypeSearchResult } from "../../hooks/useActivityTypeSearch";

interface ActivityTypePopupProps {
  isOpen: boolean;
  searchTerm: string;
  filteredActivityTypes: ActivityTypeSearchResult[];
  selectedActivityTypeText?: string;
  highlightedIndex: number;
  loading?: boolean;
  error?: string;
  position: {
    top: number;
    left: number;
    width: number;
  };
  onActivityTypeSelect: (activityType: ActivityTypeSearchResult) => void;
  onClose: () => void;
}

export function ActivityTypePopup({
  isOpen,
  searchTerm,
  filteredActivityTypes,
  selectedActivityTypeText,
  highlightedIndex,
  loading = false,
  error,
  position,
  onActivityTypeSelect,
  onClose,
}: ActivityTypePopupProps) {
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

  const showEmptyState = !loading && !error && filteredActivityTypes.length === 0;
  const showResults = !loading && !error && filteredActivityTypes.length > 0;

  return (
    <div
      ref={popupRef}
      data-activitytype-popup
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
            {searchTerm ? `"${searchTerm}"` : "Välj aktivitetstyp"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({filteredActivityTypes.length} resultat)
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
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Laddar aktivitetstyper...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {showEmptyState && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <span className="text-sm">
              {searchTerm
                ? `Ingen aktivitetstyp hittades för "${searchTerm}"`
                : "Inga aktivitetstyper tillgängliga"}
            </span>
          </div>
        )}

        {showResults &&
          filteredActivityTypes.map((activityType, index) => (
            <ActivityTypeListItem
              key={activityType.id}
              activityType={activityType}
              isSelected={activityType.displayText === selectedActivityTypeText}
              isHighlighted={index === highlightedIndex}
              searchTerm={searchTerm}
              onClick={onActivityTypeSelect}
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