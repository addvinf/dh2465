import { useState, useCallback, useEffect } from "react";
import {
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  ChevronDown,
  User,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import type { CompensationRecord } from "../../types/compensation";
import type { PersonnelRecord } from "../../types/personnel";
import {
  validateField,
  getFieldType,
  EXPECTED_HEADERS,
  REQUIRED_FIELDS,
} from "../../utils/compensationValidation";

interface CompensationExcelViewerProps {
  data: Partial<CompensationRecord>[];
  personnelList: PersonnelRecord[];
  onSave: (data: Partial<CompensationRecord>[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface CellState {
  value: string;
  originalValue: string;
  isEditing: boolean;
  validation: ReturnType<typeof validateField>;
}

export function CompensationExcelViewer({
  data,
  personnelList,
  onSave,
  onCancel,
  loading = false,
}: CompensationExcelViewerProps) {
  const [editableData, setEditableData] = useState<
    Record<string, Record<string, CellState>>
  >({});
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Initialize editable data
  useEffect(() => {
    const initialized: Record<string, Record<string, CellState>> = {};

    data.forEach((row, rowIndex) => {
      initialized[rowIndex] = {};

      EXPECTED_HEADERS.forEach((header) => {
        const value = String(row[header as keyof CompensationRecord] || "");
        const validation = validateField(header, value, personnelList);

        initialized[rowIndex][header] = {
          value,
          originalValue: value,
          isEditing: false,
          validation,
        };
      });
    });

    setEditableData(initialized);
  }, [data, personnelList]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown-container]")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  const updateCell = useCallback(
    (rowIndex: number, field: string, newValue: string) => {
      setEditableData((prev) => {
        const updated = { ...prev };
        if (!updated[rowIndex]) return prev;

        const validation = validateField(field, newValue, personnelList);

        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: {
            ...updated[rowIndex][field],
            value: newValue,
            validation,
          },
        };

        return updated;
      });
    },
    [personnelList]
  );

  const getCellBackgroundClass = useCallback(
    (validation: ReturnType<typeof validateField>) => {
      if (validation.errors.length > 0) {
        return "bg-red-900/30";
      }
      if (validation.warnings.length > 0) {
        return "bg-yellow-900/30";
      }
      return "bg-transparent";
    },
    []
  );

  const renderCell = useCallback(
    (rowIndex: number, field: string) => {
      const cellState = editableData[rowIndex]?.[field];
      if (!cellState) return null;

      const fieldType = getFieldType(field);
      const backgroundClass = getCellBackgroundClass(cellState.validation);
      const cellKey = `${rowIndex}-${field}`;
      const isDropdownActive = activeDropdown === cellKey;

      // Special handling for Ledare field with dropdown
      if (field === "Ledare") {
        const formatPersonnelName = (person: PersonnelRecord) =>
          `${person.Förnamn || ""} ${person.Efternamn || ""}`.trim();

        const validPersonnel = personnelList.filter(
          (person) => formatPersonnelName(person) !== ""
        );

        return (
          <TooltipProvider key={cellKey}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`relative h-8 ${backgroundClass}`}
                  data-dropdown-container
                >
                  <div className="flex w-full h-full">
                    <input
                      type="text"
                      value={cellState.value}
                      onChange={(e) =>
                        updateCell(rowIndex, field, e.target.value)
                      }
                      className="flex-1 h-full px-2 text-xs bg-transparent border-0 focus:outline-none focus:bg-blue-900/20 transition-colors"
                      placeholder={field}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(isDropdownActive ? null : cellKey);
                      }}
                      className="w-6 h-full flex items-center justify-center hover:bg-blue-900/20 transition-colors"
                    >
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Dropdown */}
                  {isDropdownActive && (
                    <div
                      data-dropdown-container
                      className="absolute z-50 top-full left-0 w-80 mt-1 bg-background border border-border rounded-md shadow-lg"
                    >
                      <div className="max-h-60 overflow-auto">
                        {validPersonnel.length === 0 ? (
                          <div className="p-3 text-center text-muted-foreground text-xs">
                            Ingen personal tillgänglig
                          </div>
                        ) : (
                          validPersonnel.map((person) => {
                            const personName = formatPersonnelName(person);
                            const isSelected = cellState.value === personName;

                            return (
                              <div
                                key={person.id}
                                className={`px-3 py-2 cursor-pointer transition-colors border-b border-border/50 last:border-0 hover:bg-muted/50 ${
                                  isSelected ? "bg-muted" : ""
                                }`}
                                onClick={() => {
                                  updateCell(rowIndex, field, personName);
                                  setActiveDropdown(null);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <User className="h-3 w-3 text-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">
                                      {personName}
                                    </div>
                                    {person.Befattning && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {person.Befattning}
                                      </div>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{field}</p>
                  {cellState.validation.errors.map((error, idx) => (
                    <p key={idx} className="text-red-400 text-xs">
                      • {error.message}
                    </p>
                  ))}
                  {cellState.validation.warnings.map((warning, idx) => (
                    <p key={idx} className="text-amber-400 text-xs">
                      • {warning.message}
                    </p>
                  ))}
                  {cellState.validation.errors.length === 0 &&
                    cellState.validation.warnings.length === 0 && (
                      <p className="text-green-400 text-xs">Giltig data</p>
                    )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Default text input for other fields
      return (
        <TooltipProvider key={cellKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`relative h-8 ${backgroundClass}`}>
                <input
                  type={fieldType}
                  value={cellState.value}
                  onChange={(e) => updateCell(rowIndex, field, e.target.value)}
                  className="w-full h-full px-2 text-xs bg-transparent border-0 focus:outline-none focus:bg-blue-900/20 transition-colors"
                  placeholder={field}
                  step={fieldType === "number" ? "any" : undefined}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{field}</p>
                {cellState.validation.errors.map((error, idx) => (
                  <p key={idx} className="text-red-400 text-xs">
                    • {error.message}
                  </p>
                ))}
                {cellState.validation.warnings.map((warning, idx) => (
                  <p key={idx} className="text-amber-400 text-xs">
                    • {warning.message}
                  </p>
                ))}
                {cellState.validation.errors.length === 0 &&
                  cellState.validation.warnings.length === 0 && (
                    <p className="text-green-400 text-xs">Giltig data</p>
                  )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    [
      editableData,
      updateCell,
      getCellBackgroundClass,
      activeDropdown,
      setActiveDropdown,
      personnelList,
    ]
  );

  const handleSave = async () => {
    setSaveStatus("saving");

    try {
      // Convert editable data back to CompensationRecord format
      const updatedData: Partial<CompensationRecord>[] = Object.keys(
        editableData
      ).map((rowIndex) => {
        const rowData: Partial<CompensationRecord> = {};
        const rowState = editableData[parseInt(rowIndex)];

        Object.entries(rowState).forEach(([field, cellState]) => {
          rowData[field as keyof CompensationRecord] = cellState.value as any;
        });

        return rowData;
      });

      await onSave(updatedData);
      setSaveStatus("success");

      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save compensations:", error);
      setSaveStatus("error");

      // Reset save status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const getValidationSummary = () => {
    let totalErrors = 0;
    let totalWarnings = 0;

    Object.values(editableData).forEach((row) => {
      Object.values(row).forEach((cell) => {
        totalErrors += cell.validation.errors.length;
        totalWarnings += cell.validation.warnings.length;
      });
    });

    return { totalErrors, totalWarnings };
  };

  const { totalErrors, totalWarnings } = getValidationSummary();

  return (
    <div className="space-y-4">
      {/* Header with validation summary and actions */}
      <div className="flex items-center justify-between bg-card rounded-lg p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-card-foreground">
            Granska Excel-data
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {data.length} rader importerade
              </span>
            </div>
            {totalErrors > 0 && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-400">{totalErrors} fel</span>
              </div>
            )}
            {totalWarnings > 0 && (
              <div className="flex items-center space-x-1">
                <Info className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400">
                  {totalWarnings} varningar
                </span>
              </div>
            )}
            {totalErrors === 0 && totalWarnings === 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Alla data validerade</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading || saveStatus === "saving"}
          >
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saveStatus === "saving" || totalErrors > 0}
            className={
              saveStatus === "success"
                ? "bg-green-600 hover:bg-green-700"
                : saveStatus === "error"
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }
          >
            {saveStatus === "saving" ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sparar...
              </>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Sparat!
              </>
            ) : saveStatus === "error" ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Fel vid sparning
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Spara ersättningar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Headers */}
              <div className="grid grid-cols-9 bg-muted/50 border-b">
                {EXPECTED_HEADERS.map((header) => (
                  <div
                    key={header}
                    className="px-2 py-3 text-xs font-medium text-muted-foreground border-r last:border-r-0"
                  >
                    {header}
                    {REQUIRED_FIELDS.includes(header) && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              <div className="divide-y">
                {Object.entries(editableData).map(([rowIndex]) => (
                  <div key={rowIndex} className="grid grid-cols-9">
                    {EXPECTED_HEADERS.map((header) => (
                      <div
                        key={`${rowIndex}-${header}`}
                        className="border-r last:border-r-0"
                      >
                        {renderCell(parseInt(rowIndex), header)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Klicka i celler för att redigera värden direkt</li>
          <li>Röda celler innehåller fel som måste åtgärdas</li>
          <li>Gula celler innehåller varningar som bör granskas</li>
          <li>
            För Ledare-fältet kan du klicka på pilen för att välja från
            personallistan
          </li>
          <li>
            Hovra över celler för att se detaljerad valideringsinformation
          </li>
        </ul>
      </div>
    </div>
  );
}
