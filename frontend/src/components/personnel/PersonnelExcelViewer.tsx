import { useState, useEffect, useCallback } from "react";
import { Save, X, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  validatePersonnummer,
  validateClearingnr,
  validateBankkonto,
  validateEmail,
  validateDate,
  type ValidationWarning,
} from "../../utils/personnelValidation";
import { CostCenterSearchInput } from "../costcenter/CostCenterSearchInput";
import { useCostCenterSearch } from "../../hooks/useCostCenterSearch";
import { downloadExcelAOA } from "../../utils/excelUtils";
import type { PersonnelRecord } from "../../types/personnel";
import { EXPECTED_PERSONNEL_HEADERS } from "./PersonnelExcelUpload";

interface PersonnelExcelViewerProps {
  data: Partial<PersonnelRecord>[];
  personnelList: PersonnelRecord[];
  onSave: (data: Partial<PersonnelRecord>[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface CellState {
  value: string;
  originalValue: string;
  isEditing: boolean;
  validation: ValidationWarning[];
}

export function PersonnelExcelViewer({
  data,
  personnelList,
  onSave,
  onCancel,
  loading = false,
}: PersonnelExcelViewerProps) {
  const [editableData, setEditableData] = useState<
    Record<string, Record<string, CellState>>
  >({});
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  // Use cost center search for validation
  const { isValidCostCenter } = useCostCenterSearch();

  // Initialize editable data
  useEffect(() => {
    const initialized: Record<string, Record<string, CellState>> = {};

    data.forEach((row, rowIndex) => {
      initialized[rowIndex] = {};

      EXPECTED_PERSONNEL_HEADERS.forEach((header) => {
        const value = String(row[header as keyof PersonnelRecord] || "");
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

  // Validate field based on personnel validation rules
  const validateField = useCallback(
    (fieldName: string, value: string, _personnelList: PersonnelRecord[]): ValidationWarning[] => {
      const strValue = String(value || "").trim();
      
      if (!strValue) return []; // Don't validate empty fields

      switch (fieldName) {
        case "Personnummer":
          return validatePersonnummer(strValue, false);
        case "Clearingnr":
          return validateClearingnr(strValue);
        case "Bankkonto":
          return validateBankkonto(strValue);
        case "E-post":
          if (!validateEmail(strValue)) {
            return [{
              field: "E-post",
              message: "Ogiltig e-postadress",
              severity: "error",
            }];
          }
          break;
        case "Ändringsdag":
          return validateDate(strValue, "Ändringsdag");
        case "Kostnadsställe":
          if (!isValidCostCenter(strValue)) {
            return [{
              field: "Kostnadsställe",
              message: "Kostnadsställe finns inte i systemet",
              severity: "error",
            }];
          }
          break;
        case "Skattesats":
          const rate = Number(strValue);
          if (isNaN(rate) || rate < 0 || rate > 100) {
            return [{
              field: "Skattesats",
              message: "Skattesats måste vara mellan 0-100%",
              severity: "error",
            }];
          }
          break;
        default:
          return [];
      }

      return [];
    },
    [isValidCostCenter]
  );

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
    [validateField, personnelList]
  );

  const getCellBackgroundClass = useCallback(
    (validation: ValidationWarning[]) => {
      if (validation.some(v => v.severity === "error")) {
        return "bg-red-900/30";
      }
      if (validation.some(v => v.severity === "warning")) {
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

      const backgroundClass = getCellBackgroundClass(cellState.validation);
      const cellKey = `${rowIndex}-${field}`;

      // Special handling for Kostnadsställe field with cost center search
      if (field === "Kostnadsställe") {
        return (
          <div key={cellKey} className={`relative h-8 ${backgroundClass}`}>
            <CostCenterSearchInput
              value={cellState.value}
              onChange={(newValue) => updateCell(rowIndex, field, newValue)}
              className="h-full px-2 text-xs bg-transparent border-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-transparent focus-visible:border-transparent transition-none"
              placeholder="Välj kostnadsställe..."
            />
          </div>
        );
      }

      // Special handling for personnel search (if needed)
      if (field === "Förnamn" || field === "Efternamn") {
        // Use regular text input for names since they're not searchable
        return (
          <TooltipProvider key={cellKey}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`relative h-8 ${backgroundClass}`}>
                  <input
                    type="text"
                    value={cellState.value}
                    onChange={(e) => updateCell(rowIndex, field, e.target.value)}
                    className="h-full px-2 text-xs bg-transparent border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-none w-full"
                    placeholder={`Ange ${field.toLowerCase()}...`}
                  />
                </div>
              </TooltipTrigger>
              {cellState.validation.length > 0 && (
                <TooltipContent>
                  <div className="space-y-1">
                    {cellState.validation.map((warning, idx) => (
                      <p key={idx} className="text-xs">
                        {warning.message}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Default text input for other fields
      const inputType = field === "Skattesats" || field === "Månad" || field === "Timme" || field === "Heldag" 
        ? "number" 
        : field === "E-post" 
        ? "email" 
        : field === "Ändringsdag" 
        ? "date" 
        : "text";

      return (
        <TooltipProvider key={cellKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`relative h-8 ${backgroundClass}`}>
                <input
                  type={inputType}
                  value={cellState.value}
                  onChange={(e) => updateCell(rowIndex, field, e.target.value)}
                  className="h-full px-2 text-xs bg-transparent border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-none w-full"
                  placeholder={`Ange ${field.toLowerCase()}...`}
                />
              </div>
            </TooltipTrigger>
            {cellState.validation.length > 0 && (
              <TooltipContent>
                <div className="space-y-1">
                  {cellState.validation.map((warning, idx) => (
                    <p key={idx} className="text-xs">
                      {warning.message}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
    [editableData, updateCell, getCellBackgroundClass]
  );

  const handleSave = async () => {
    setSaveStatus("saving");

    try {
      // Convert editable data back to PersonnelRecord format
      const updatedData: Partial<PersonnelRecord>[] = Object.keys(
        editableData
      ).map((rowIndex) => {
        const rowData: Partial<PersonnelRecord> = {};
        Object.entries(editableData[parseInt(rowIndex)]).forEach(([field, cellState]) => {
          rowData[field as keyof PersonnelRecord] = cellState.value as any;
        });
        return rowData;
      });

      await onSave(updatedData);
      setSaveStatus("success");

      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save personnel:", error);
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
        totalErrors += cell.validation.filter(v => v.severity === "error").length;
        totalWarnings += cell.validation.filter(v => v.severity === "warning").length;
      });
    });

    return { totalErrors, totalWarnings };
  };

  const { totalErrors, totalWarnings } = getValidationSummary();

  const handleDownload = () => {
    // Convert to AOA format for download
    const headers = EXPECTED_PERSONNEL_HEADERS;
    const rows = Object.keys(editableData).map((rowIndex) => {
      return headers.map((header) => editableData[parseInt(rowIndex)][header]?.value || "");
    });

    downloadExcelAOA("redigerad_personal.xlsx", headers, rows);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Header with validation summary and actions */}
      <div className="flex items-center justify-between bg-card rounded-lg p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Personal Excel-data</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {Object.keys(editableData).length} personer
            </span>
            {totalErrors > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalErrors} fel
              </Badge>
            )}
            {totalWarnings > 0 && (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalWarnings} varningar
              </Badge>
            )}
            {totalErrors === 0 && totalWarnings === 0 && (
              <Badge variant="secondary" className="text-xs bg-green-900/50 text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Alla fält validerade
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Ladda ner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading || saveStatus === "saving"}
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <X className="w-4 h-4 mr-2" />
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saveStatus === "saving"}
            size="sm"
            className={cn(
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              saveStatus === "success"
                ? "bg-green-600 hover:bg-green-700"
                : saveStatus === "error"
                ? "bg-red-600 hover:bg-red-700"
                : undefined
            )}
          >
            {saveStatus === "saving" ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sparar...
              </>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Sparat!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Spara personer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-x-auto overflow-y-auto max-h-[60vh] w-full">
            <table className="text-xs border-collapse w-max min-w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-2 py-2 text-left border-r bg-muted/50 sticky left-0 z-20">#</th>
                  {EXPECTED_PERSONNEL_HEADERS.map((header) => (
                    <th
                      key={header}
                      className="px-2 py-2 text-left border-r bg-muted/50 min-w-32 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(editableData).map((rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-muted/20">
                    <td className="px-2 py-1 border-r bg-muted/20 text-muted-foreground sticky left-0 z-10">
                      {parseInt(rowIndex) + 1}
                    </td>
                    {EXPECTED_PERSONNEL_HEADERS.map((header) => (
                      <td key={header} className="border-r min-w-32">
                        {renderCell(parseInt(rowIndex), header)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
        <p className="font-medium mb-2">Redigeringshjälp:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Klicka i en cell för att redigera värdet</li>
          <li>Röda celler indikerar valideringsfel som bör åtgärdas</li>
          <li>Gula celler indikerar varningar som kan ignoreras</li>
          <li>Personnummer normaliseras automatiskt till 12-siffrigt format</li>
          <li>Kostnadsställe: Sök bland tillgängliga kostnadsställen</li>
          <li>E-post är obligatorisk för varje person</li>
          <li>Endast personer med e-post kommer att sparas</li>
        </ul>
      </div>
    </div>
  );
}