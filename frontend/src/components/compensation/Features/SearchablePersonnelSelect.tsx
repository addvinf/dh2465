import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Search, User } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/input";
import { cn } from "../../../lib/utils";

import { fetchPersonnel } from "../../../services/personnelService";
import type { PersonnelRecord } from "../../../types/personnel";

interface SearchablePersonnelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function SearchablePersonnelSelect({
  value,
  onValueChange,
  placeholder = "Välj person...",
  className,
  disabled = false,
  error,
}: SearchablePersonnelSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPersonnel = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const result = await fetchPersonnel("test_förening");
        setPersonnel(result.data);
      } catch (error) {
        console.error("Failed to load personnel:", error);
        setLoadError("Kunde inte ladda personal");
      } finally {
        setLoading(false);
      }
    };
    loadPersonnel();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPersonnelName = (person: PersonnelRecord) =>
    `${person.Förnamn || ""} ${person.Efternamn || ""}`.trim();

  const validPersonnel = personnel.filter(
    (person) => formatPersonnelName(person) !== ""
  );

  const filteredPersonnel = validPersonnel.filter((person) => {
    const name = formatPersonnelName(person).toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      name.includes(search) || person.Befattning?.toLowerCase().includes(search)
    );
  });

  const selectedPerson = validPersonnel.find(
    (person) => formatPersonnelName(person) === value
  );

  const handleSelect = (person: PersonnelRecord) => {
    const personName = formatPersonnelName(person);
    onValueChange(personName);
    setOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onValueChange("");
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

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
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredPersonnel[highlightedIndex]) {
          handleSelect(filteredPersonnel[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9",
            (error || loadError) && "border-destructive"
          )}
          onClick={() => {
            setOpen(!open);
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          disabled={loading || disabled}
        >
          <div className="flex items-center space-x-2 truncate">
            {selectedPerson && <User className="h-3 w-3 text-foreground" />}
            <span className="truncate">
              {selectedPerson
                ? formatPersonnelName(selectedPerson)
                : placeholder}
            </span>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {value && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </div>

      {open && (
        <div className="absolute z-50 w-full min-w-[400px] mt-1 bg-background border border-border rounded-md shadow-lg">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Sök personal..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 h-9"
              />
            </div>
          </div>
          <div className="max-h-[250px] overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Laddar personal...
              </div>
            ) : loadError ? (
              <div className="p-4 text-center text-destructive">
                {loadError}
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm
                  ? "Ingen personal hittades."
                  : "Ingen personal tillgänglig."}
              </div>
            ) : (
              filteredPersonnel.map((person, index) => {
                const personName = formatPersonnelName(person);
                const isSelected = value === personName;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={person.id}
                    className={cn(
                      "px-3 py-3 cursor-pointer transition-colors duration-150 border-b border-border/50 last:border-0",
                      isSelected && "bg-muted",
                      isHighlighted && "bg-accent",
                      !isSelected && !isHighlighted && "hover:bg-muted/50"
                    )}
                    onClick={() => handleSelect(person)}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate">
                            {personName}
                          </span>
                          {person.Befattning && (
                            <div className="text-xs text-muted-foreground">
                              <span className="truncate">
                                {person.Befattning}
                              </span>
                            </div>
                          )}
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
              })
            )}
          </div>
        </div>
      )}

      {(error || loadError) && (
        <p className="text-xs text-destructive mt-1">{error || loadError}</p>
      )}
    </div>
  );
}
