import { useState, useRef, useCallback, useEffect } from "react";
import { Check, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { SalaryTypePopup } from "./SalaryTypePopup";
import { useSalaryTypeSearch } from "../../hooks/useSalaryTypeSearch";
import type { SalaryTypeSearchResult } from "../../hooks/useSalaryTypeSearch";

interface SalaryTypeSearchInputProps {
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

export function SalaryTypeSearchInput({
  value,
  onChange,
  onBlur,
  placeholder = "Skriv för att söka löneart...",
  className,
  disabled = false,
  error,
  organization,
  autoFocus = false,
  hideError = false, // Add the new prop
  useTooltip = false, // Add the new prop
}: SalaryTypeSearchInputProps) {
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
    filterSalaryTypes,
    getTopSuggestion,
    isValidSalaryType,
  } = useSalaryTypeSearch({ organization });

  const filteredSalaryTypes = filterSalaryTypes(searchTerm);

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
    if (relatedTarget && relatedTarget.closest("[data-salarytype-popup]")) {
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
    if (!isPopupOpen || filteredSalaryTypes.length === 0) {
      if (e.key === "Enter" && !isPopupOpen) {
        setIsPopupOpen(true);
        setTimeout(() => calculatePopupPosition(), 10);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSalaryTypes.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSalaryTypes.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSalaryTypes.length) {
          handleSalaryTypeSelect(filteredSalaryTypes[highlightedIndex]);
        } else if (filteredSalaryTypes.length > 0) {
          handleSalaryTypeSelect(filteredSalaryTypes[0]);
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
        // Auto-complete with top suggestion
        if (filteredSalaryTypes.length > 0) {
          e.preventDefault();
          const topSuggestion = getTopSuggestion(searchTerm);
          if (topSuggestion) {
            handleSalaryTypeSelect(topSuggestion);
          }
        }
        break;
    }
  };

  // Handle salary type selection
  const handleSalaryTypeSelect = (salaryType: SalaryTypeSearchResult) => {
    onChange(salaryType.displayText);
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
    if (isPopupOpen) {
      window.addEventListener("resize", calculatePopupPosition);
      return () => window.removeEventListener("resize", calculatePopupPosition);
    }
  }, [isPopupOpen, calculatePopupPosition]);

  // Validate current value
  const isValid = isValidSalaryType(value);
  const showError = error || loadError || (!isValid && value.trim());

  const inputComponent = (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "pr-8",
            showError && !hideError && "border-destructive focus:border-destructive",
            isValid && value.trim() && "border-green-500 focus:border-green-500",
            className
          )}
          autoComplete="off"
          spellCheck={false}
        />
        
        {/* Validation icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {value.trim() && (
            <>
              {isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <HelpCircle className="h-4 w-4 text-orange-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Error message - only show if not hidden */}
      {showError && !hideError && (
        <p className="text-xs text-destructive mt-1">
          {error || loadError || "Ogiltig löneart"}
        </p>
      )}

      {/* Popup portal */}
      {isPopupOpen && typeof window !== "undefined" &&
        createPortal(
          <SalaryTypePopup
            isOpen={isPopupOpen}
            searchTerm={searchTerm}
            filteredSalaryTypes={filteredSalaryTypes}
            selectedSalaryTypeText={value}
            highlightedIndex={highlightedIndex}
            loading={loading}
            error={loadError || undefined}
            position={popupPosition}
            onSalaryTypeSelect={handleSalaryTypeSelect}
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
              <p className="text-xs">
                {error || loadError || "Ogiltig löneart"}
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return inputComponent;
}