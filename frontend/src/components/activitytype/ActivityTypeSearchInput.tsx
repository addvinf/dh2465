import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, HelpCircle } from "lucide-react";
import { Input } from "../ui/input";
import { ActivityTypePopup } from "./ActivityTypePopup";
import { useActivityTypeSearch } from "../../hooks/useActivityTypeSearch";
import type { ActivityTypeSearchResult } from "../../hooks/useActivityTypeSearch";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ActivityTypeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  organization?: string;
  autoFocus?: boolean;
  hideError?: boolean; // New prop to hide error display
  useTooltip?: boolean; // New prop to enable tooltip mode
}

export function ActivityTypeSearchInput({
  value,
  onChange,
  onBlur,
  placeholder = "Skriv för att söka aktivitetstyp...",
  className,
  disabled = false,
  error,
  organization,
  autoFocus = false,
  hideError = false, // Add the new prop
  useTooltip = false, // Add the new prop
}: ActivityTypeSearchInputProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    loading,
    error: loadError,
    filterActivityTypes,
    findActivityTypeByText,
    getTopSuggestion,
    isValidActivityType,
  } = useActivityTypeSearch({ organization });

  const filteredActivityTypes = filterActivityTypes(searchTerm);

  // Calculate popup position relative to input
  const calculatePopupPosition = useCallback(() => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popupHeight = 300; // Approximate max height
    const popupWidth = Math.max(rect.width, 300);

    // Prefer below, but use above if not enough space
    const useAbove = spaceBelow < popupHeight && spaceAbove > spaceBelow;
    
    // Position popup aligned with the input field
    const leftPosition = Math.max(10, Math.min(rect.left, viewportWidth - popupWidth - 10));
    const topPosition = useAbove 
      ? Math.max(10, rect.top - popupHeight - 5)
      : rect.bottom + 5;

    setPopupPosition({
      top: topPosition,
      left: leftPosition,
      width: Math.min(popupWidth, Math.max(rect.width, 300)),
    });
  }, []);

  // Handle input changes
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSearchTerm(newValue);
    setHighlightedIndex(-1);

    if (newValue.trim() && !isPopupOpen) {
      setIsPopupOpen(true);
      // Small delay to ensure DOM is updated before calculating position
      setTimeout(() => calculatePopupPosition(), 10);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setSearchTerm(value);
    setIsPopupOpen(true);
    // Small delay to ensure DOM is updated before calculating position
    setTimeout(() => calculatePopupPosition(), 10);
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if focus moved to popup
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest("[data-activitytype-popup]")) {
      return;
    }

    // Delay to allow popup clicks
    setTimeout(() => {
      setIsPopupOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
      onBlur?.();
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isPopupOpen || filteredActivityTypes.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredActivityTypes.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActivityTypes.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleActivityTypeSelect(filteredActivityTypes[highlightedIndex]);
        } else if (filteredActivityTypes.length > 0) {
          handleActivityTypeSelect(filteredActivityTypes[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsPopupOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        const suggestion = getTopSuggestion(searchTerm);
        if (suggestion && !isValidActivityType(value)) {
          e.preventDefault();
          handleActivityTypeSelect(suggestion);
        }
        break;
    }
  };

  // Handle activity type selection
  const handleActivityTypeSelect = (activityType: ActivityTypeSearchResult) => {
    onChange(activityType.displayText);
    setIsPopupOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle popup close
  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  // Update popup position on window resize
  useEffect(() => {
    if (!isPopupOpen) return;
    const handleResize = () => calculatePopupPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isPopupOpen, calculatePopupPosition]);

  // Validate current value
  const currentActivityType = findActivityTypeByText(value);
  const isValid = isValidActivityType(value);
  const showError = error || loadError || (!isValid && value.trim());

  const inputComponent = (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          className,
          showError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          isValid && value.trim() && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
        )}
        aria-invalid={showError ? "true" : "false"}
        aria-describedby={showError ? "activitytype-error" : undefined}
        autoComplete="off"
        role="combobox"
        aria-expanded={isPopupOpen}
        aria-haspopup="listbox"
      />

      {/* Validation indicator */}
      {value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {currentActivityType ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <HelpCircle className="w-3 h-3 text-yellow-500" />
          )}
        </div>
      )}

      {showError && !hideError && (
        <div id="activitytype-error" className="mt-1 text-sm text-red-600">
          {error || loadError || "Ogiltig aktivitetstyp"}
        </div>
      )}

      {currentActivityType && !hideError && (
        <div className="mt-1 text-xs text-muted-foreground">
          Konto: {currentActivityType.account} • Kostnadsställe: {currentActivityType.costCenter}
        </div>
      )}

      {/* Popup portal */}
      {isPopupOpen &&
        createPortal(
          <ActivityTypePopup
            isOpen={isPopupOpen}
            searchTerm={searchTerm}
            filteredActivityTypes={filteredActivityTypes}
            selectedActivityTypeText={value}
            highlightedIndex={highlightedIndex}
            loading={loading}
            error={loadError || undefined}
            position={popupPosition}
            onActivityTypeSelect={handleActivityTypeSelect}
            onClose={handlePopupClose}
          />,
          document.body
        )}
    </div>
  );

  if (useTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {inputComponent}
          </TooltipTrigger>
          {showError && (
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Validering</p>
                <p className="text-red-400 text-xs">
                  {error || loadError || "Aktivitetstyp finns inte i inställningarna"}
                </p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return inputComponent;
}