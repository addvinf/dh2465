import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "../../ui/input";
import { cn } from "../../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { PersonnelPopup } from "./PersonnelPopup";
import { usePersonnelSearch } from "../../../hooks/usePersonnelSearch";
import type { PersonnelSearchResult } from "../../../hooks/usePersonnelSearch";

interface PersonnelSearchInputProps {
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

export function PersonnelSearchInput({
  value,
  onChange,
  onBlur,
  placeholder = "Skriv för att söka personal...",
  className,
  disabled = false,
  error,
  organization,
  autoFocus = false,
}: PersonnelSearchInputProps) {
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
    filterPersonnel,
    findPersonByName,
    getTopSuggestion,
  } = usePersonnelSearch({ organization });

  const filteredPersonnel = filterPersonnel(searchTerm);

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
    if (relatedTarget && relatedTarget.closest("[data-personnel-popup]")) {
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
    if (!isPopupOpen || filteredPersonnel.length === 0) {
      if (e.key === "Enter" || e.key === "Tab") {
        // Try to auto-complete with top suggestion
        const topSuggestion = getTopSuggestion(value);
        if (topSuggestion) {
          handlePersonSelect(topSuggestion);
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredPersonnel.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredPersonnel.length - 1
        );
        break;

      case "Enter":
      case "Tab":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handlePersonSelect(filteredPersonnel[highlightedIndex]);
        } else if (filteredPersonnel.length > 0) {
          handlePersonSelect(filteredPersonnel[0]);
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

  // Handle person selection
  const handlePersonSelect = (person: PersonnelSearchResult) => {
    onChange(person.name);
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
  const currentPerson = findPersonByName(value);
  const isValidPerson = !value || currentPerson !== null;
  const showError = error || loadError || (!isValidPerson && value.trim());

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
                !isValidPerson && value.trim() && "bg-destructive/5"
              )}
            />

            {/* Validation indicator */}
            {value && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {currentPerson ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
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
                {error || loadError || "Person finns inte i personallistan"}
              </p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Popup portal */}
      {isPopupOpen &&
        createPortal(
          <PersonnelPopup
            isOpen={isPopupOpen}
            searchTerm={searchTerm}
            filteredPersonnel={filteredPersonnel}
            selectedPersonName={value}
            highlightedIndex={highlightedIndex}
            loading={loading}
            error={loadError || undefined}
            position={popupPosition}
            onPersonSelect={handlePersonSelect}
            onClose={handlePopupClose}
          />,
          document.body
        )}
    </TooltipProvider>
  );
}
