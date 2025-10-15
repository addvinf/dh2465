import { useEffect, useRef } from "react";
import { Search, AlertCircle } from "lucide-react";
import { PersonnelListItem } from "./PersonnelListItem";
import type { PersonnelSearchResult } from "../../../hooks/usePersonnelSearch";

interface PersonnelPopupProps {
  isOpen: boolean;
  searchTerm: string;
  filteredPersonnel: PersonnelSearchResult[];
  selectedPersonName?: string;
  highlightedIndex: number;
  loading?: boolean;
  error?: string;
  position: {
    top: number;
    left: number;
    width: number;
  };
  onPersonSelect: (person: PersonnelSearchResult) => void;
  onClose: () => void;
}

export function PersonnelPopup({
  isOpen,
  searchTerm,
  filteredPersonnel,
  selectedPersonName,
  highlightedIndex,
  loading = false,
  error,
  position,
  onPersonSelect,
  onClose,
}: PersonnelPopupProps) {
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

  const showEmptyState = !loading && !error && filteredPersonnel.length === 0;
  const showResults = !loading && !error && filteredPersonnel.length > 0;

  return (
    <div
      ref={popupRef}
      data-personnel-popup
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
          <span className="text-sm font-medium text-foreground">
            Välj personal
          </span>
          {searchTerm && (
            <span className="text-xs text-muted-foreground">
              ({filteredPersonnel.length} resultat)
            </span>
          )}
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
          <div className="p-4 text-center">
            <div className="inline-flex items-center space-x-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Laddar personal...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <div className="inline-flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {showEmptyState && (
          <div className="p-4 text-center text-muted-foreground">
            <div className="space-y-1">
              <div className="text-sm">
                {searchTerm
                  ? "Ingen personal hittades"
                  : "Ingen personal tillgänglig"}
              </div>
              {searchTerm && (
                <div className="text-xs">Försök med ett annat sökord</div>
              )}
            </div>
          </div>
        )}

        {showResults && (
          <>
            {filteredPersonnel.map((person, index) => (
              <PersonnelListItem
                key={person.id}
                person={person}
                isSelected={person.name === selectedPersonName}
                isHighlighted={index === highlightedIndex}
                searchTerm={searchTerm}
                onClick={onPersonSelect}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {showResults && (
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground text-center">
            Använd ↑↓ för att navigera, Enter för att välja, Esc för att stänga
          </div>
        </div>
      )}
    </div>
  );
}
