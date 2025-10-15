import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, HelpCircle } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { CostCenterPopup } from "./CostCenterPopup";
import { useCostCenterSearch } from "../../hooks/useCostCenterSearch";
import type { CostCenterSearchResult } from "../../hooks/useCostCenterSearch";

interface CostCenterSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  organization?: string;
  autoFocus?: boolean;
}

export function CostCenterSearchInput({
  value,
  onChange,
  onBlur,
  placeholder = "Skriv för att söka kostnadsställe...",
  className,
  disabled = false,
  error,
  organization,
  autoFocus = false,
}: CostCenterSearchInputProps) {
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
    filterCostCenters,
    findCostCenterByText,
    getTopSuggestion,
    isValidCostCenter,
  } = useCostCenterSearch({ organization });

  const filteredCostCenters = filterCostCenters(searchTerm);

  // Calculate popup position relative to input
  const calculatePopupPosition = useCallback(() => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const popupHeight = 300; // Approximate max height

    setPopupPosition({
      top:
        spaceBelow >= popupHeight
          ? rect.bottom + 2
          : rect.top - popupHeight - 2,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Handle input changes
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSearchTerm(newValue);
    setHighlightedIndex(-1);

    if (newValue.trim() && !isPopupOpen) {
      setIsPopupOpen(true);
      calculatePopupPosition();
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setSearchTerm(value);
    setIsPopupOpen(true);
    calculatePopupPosition();
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if focus moved to popup
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest("[data-costcenter-popup]")) {
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
    if (!isPopupOpen || filteredCostCenters.length === 0) {
      if (e.key === "Enter" || e.key === "Tab") {
        // Try to auto-complete with top suggestion
        const topSuggestion = getTopSuggestion(value);
        if (topSuggestion) {
          handleCostCenterSelect(topSuggestion);
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCostCenters.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCostCenters.length - 1
        );
        break;

      case "Enter":
      case "Tab":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleCostCenterSelect(filteredCostCenters[highlightedIndex]);
        } else if (filteredCostCenters.length > 0) {
          handleCostCenterSelect(filteredCostCenters[0]);
        }
        break;

      case "Escape":
        setIsPopupOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle cost center selection
  const handleCostCenterSelect = (costCenter: CostCenterSearchResult) => {
    onChange(costCenter.displayText);
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
  const currentCostCenter = findCostCenterByText(value);
  const isValid = isValidCostCenter(value);
  const showError = error || loadError || (!isValid && value.trim());

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={(e) => handleBlur(e)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || loading}
              autoFocus={autoFocus}
              className={cn(
                className,
                showError && "border-destructive focus:border-destructive",
                !isValid && value.trim() && "bg-destructive/5"
              )}
            />

            {/* Validation indicator */}
            {value && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {currentCostCenter ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <HelpCircle className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>

        {/* Validation tooltip */}
        {showError && (
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Validering</p>
              <p className="text-red-400 text-xs">
                {error ||
                  loadError ||
                  "Kostnadsställe finns inte i inställningarna"}
              </p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Popup portal */}
      {isPopupOpen &&
        createPortal(
          <CostCenterPopup
            isOpen={isPopupOpen}
            searchTerm={searchTerm}
            filteredCostCenters={filteredCostCenters}
            selectedCostCenterText={value}
            highlightedIndex={highlightedIndex}
            loading={loading}
            error={loadError || undefined}
            position={popupPosition}
            onCostCenterSelect={handleCostCenterSelect}
            onClose={handlePopupClose}
          />,
          document.body
        )}
    </TooltipProvider>
  );
}
