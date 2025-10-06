import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "./ui/Button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Save,
  Download,
  Edit3,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { ValidationWarnings } from "./personnel/ValidationWarnings";
import {
  validatePersonnummer,
  validateClearingnr,
  validateBankkonto,
  validateDate,
  validateEmail,
  normalizePersonnummer,
  type ValidationWarning,
} from "../utils/personnelValidation";
import * as XLSX from "xlsx";

interface ExcelViewerProps {
  data: any[][];
  headers: string[];
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any[][]) => void;
}

export function ExcelViewer({
  data,
  headers,
  fileName,
  isOpen,
  onClose,
  onSave,
}: ExcelViewerProps) {
  const [editableData, setEditableData] = useState<any[][]>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Map<string, ValidationWarning[]>
  >(new Map());
  const [allWarnings, setAllWarnings] = useState<ValidationWarning[]>([]);
  const [warningsExpanded, setWarningsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditableData([...data]);
    // Validate initial data
    validateAllData([...data]);
  }, [data]);

  // Validate a specific cell value based on the header
  const validateCell = (
    rowIndex: number,
    colIndex: number,
    value: any,
    headerName: string
  ): ValidationWarning[] => {
    const cellWarnings: ValidationWarning[] = [];
    const strValue = String(value || "").trim();

    if (!strValue) return cellWarnings; // Don't validate empty cells

    switch (headerName) {
      case "Personnummer":
        cellWarnings.push(...validatePersonnummer(strValue, false));
        break;
      case "Clearingnr":
        cellWarnings.push(...validateClearingnr(strValue));
        break;
      case "Bankkonto":
        cellWarnings.push(...validateBankkonto(strValue));
        break;
      case "E-post":
        if (!validateEmail(strValue)) {
          cellWarnings.push({
            field: "E-post",
            message: "Ogiltig e-postadress",
            severity: "error",
          });
        }
        break;
      case "Ändringsdag":
        cellWarnings.push(...validateDate(strValue, "Ändringsdag"));
        break;
      default:
        // No validation for other fields
        break;
    }

    return cellWarnings;
  };

  // Validate all data in the Excel file
  const validateAllData = (dataToValidate: any[][]) => {
    const newValidationErrors = new Map<string, ValidationWarning[]>();
    const allWarningsArray: ValidationWarning[] = [];

    dataToValidate.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const headerName = headers[colIndex];
        const warnings = validateCell(
          rowIndex,
          colIndex,
          cellValue,
          headerName
        );

        if (warnings.length > 0) {
          const cellKey = `${rowIndex}-${colIndex}`;
          newValidationErrors.set(cellKey, warnings);

          // Add warnings with row context
          warnings.forEach((warning) => {
            allWarningsArray.push({
              ...warning,
              field: `${headerName} (rad ${rowIndex + 1})`,
            });
          });
        }
      });
    });

    setValidationErrors(newValidationErrors);
    setAllWarnings(allWarningsArray);
  };

  // Get validation errors for a specific cell
  const getCellErrors = (
    rowIndex: number,
    colIndex: number
  ): ValidationWarning[] => {
    const cellKey = `${rowIndex}-${colIndex}`;
    return validationErrors.get(cellKey) || [];
  };

  useEffect(() => {
    setEditableData([...data]);
  }, [data]);

  const handleCellEdit = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(String(editableData[rowIndex][colIndex] || ""));
  };

  const handleSaveCell = () => {
    if (editingCell) {
      const newData = [...editableData];
      newData[editingCell.row][editingCell.col] = editValue;
      setEditableData(newData);

      // Re-validate all data after change
      validateAllData(newData);

      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleSaveAll = () => {
    // Normalize personnummer before saving
    const normalizedData = editableData.map((row, rowIndex) =>
      row.map((cellValue, colIndex) => {
        const headerName = headers[colIndex];
        if (headerName === "Personnummer" && cellValue) {
          return normalizePersonnummer(String(cellValue));
        }
        return cellValue;
      })
    );

    onSave(normalizedData);
    toast({
      title: "Data sparad",
      description: "Excel-data har sparats framgångsrikt",
    });
  };

  const handleDownload = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...editableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `redigerad_${fileName}`);

    toast({
      title: "Fil nedladdad",
      description: "Excel-filen har laddats ner med dina ändringar",
    });
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Excel-fil: {fileName}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{editableData.length} rader</Badge>
                <Badge variant="secondary">{headers.length} kolumner</Badge>
                {allWarnings.length > 0 && (
                  <Badge variant="destructive">{allWarnings.length} fel</Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Klicka på en cell för att redigera. Använd knapparna nedan för att
              spara ändringar.
            </DialogDescription>
          </DialogHeader>

          {/* Collapsible Validation Warnings */}
          {allWarnings.length > 0 && (
            <div className="border border-orange-200 rounded-lg">
              <Button
                variant="ghost"
                onClick={() => setWarningsExpanded(!warningsExpanded)}
                className="w-full flex items-center justify-between p-3 h-auto"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    {allWarnings.length} validationsproblem funna
                  </span>
                </div>
                {warningsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              {warningsExpanded && (
                <div className="p-3 pt-0">
                  <ValidationWarnings warnings={allWarnings} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAll}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Spara ändringar
              </Button>
              <Button
                variant="secondary"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Ladda ner
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              Stäng
            </Button>
          </div>

          <ScrollArea className="h-[60vh] w-full border rounded-lg overflow-auto">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 sticky left-0 bg-background z-10">
                      #
                    </TableHead>
                    {headers.map((header, index) => (
                      <TableHead
                        key={index}
                        className="min-w-[150px] whitespace-nowrap"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium text-muted-foreground sticky left-0 bg-background z-10">
                        {rowIndex + 1}
                      </TableCell>
                      {headers.map((_, colIndex) => {
                        const cellErrors = getCellErrors(rowIndex, colIndex);
                        const hasErrors = cellErrors.length > 0;
                        const hasOnlyWarnings =
                          cellErrors.length > 0 &&
                          cellErrors.every(
                            (error) => error.severity === "warning"
                          );
                        const hasActualErrors =
                          cellErrors.length > 0 &&
                          cellErrors.some(
                            (error) => error.severity === "error"
                          );

                        return (
                          <TableCell key={colIndex} className="min-w-[150px]">
                            {editingCell?.row === rowIndex &&
                            editingCell?.col === colIndex ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 min-w-[120px]"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveCell();
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveCell}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`cursor-pointer hover:bg-accent p-1 rounded group flex items-center justify-between min-w-[120px] relative ${
                                      hasActualErrors
                                        ? "border border-red-500 bg-red-500/10 dark:bg-red-500/20"
                                        : hasOnlyWarnings
                                        ? "border border-orange-500 bg-orange-500/10 dark:bg-orange-500/20"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleCellEdit(rowIndex, colIndex)
                                    }
                                  >
                                    <span className="truncate">
                                      {row[colIndex] || ""}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {hasActualErrors && (
                                        <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                      )}
                                      {hasOnlyWarnings && (
                                        <Info className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                      )}
                                      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                {hasErrors && (
                                  <TooltipContent>
                                    <div className="max-w-xs">
                                      {cellErrors.map((error, index) => (
                                        <div key={index} className="text-sm">
                                          {error.message}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
