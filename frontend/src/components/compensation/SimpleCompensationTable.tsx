import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, X, Filter } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { useCostCenterSearch } from "../../hooks/useCostCenterSearch";
import { useActivityTypeSearch } from "../../hooks/useActivityTypeSearch";
import { usePersonnelSearch } from "../../hooks/usePersonnelSearch";
import { CompensationTableRow } from "./Features/CompensationTableRow";
import { CompensationAddRow } from "./Features/CompensationAddRow";
import type { CompensationRecord } from "../../types/compensation";

interface SimpleCompensationTableProps {
  compensations: CompensationRecord[];
  onAdd: (compensation: Omit<CompensationRecord, "id">) => Promise<void>;
  onEdit: (
    id: string,
    compensation: Partial<CompensationRecord>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

interface CompensationFormData {
  "Upplagd av": string;
  "Avser Mån/år": string;
  Ledare: string;
  Kostnadsställe: string;
  Aktivitetstyp: string;
  Antal: number;
  Ersättning: number;
  "Datum utbet": string;
  "Eventuell kommentar": string;
}

export function SimpleCompensationTable({
  compensations,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
}: SimpleCompensationTableProps) {
  const { settings } = useSettings();
  const { getCodeFromDisplayText: getCostCenterCode, getDisplayTextFromCode: getCostCenterDisplay } = useCostCenterSearch();
  const { getAccountFromDisplayText: getActivityAccount, getDisplayTextFromAccount: getActivityDisplay } = useActivityTypeSearch();
  const { findPersonByName } = usePersonnelSearch({ organization: "test_förening" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCostCenter, setFilterCostCenter] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [formData, setFormData] = useState<CompensationFormData>({
    "Upplagd av": settings.organization?.contactPerson || "",
    "Avser Mån/år": "",
    Ledare: "",
    Kostnadsställe: "",
    Aktivitetstyp: "",
    Antal: 0,
    Ersättning: 0,
    "Datum utbet": "",
    "Eventuell kommentar": "",
  });

  // Auto-populate Ersättning when Ledare and Aktivitetstyp change
  useEffect(() => {
    // Only auto-populate if both Ledare and Aktivitetstyp are set
    if (!formData.Ledare || !formData.Aktivitetstyp) return;

    // Get the activity code (account number)
    const activityCode = getActivityAccount(formData.Aktivitetstyp);
    
    // Find the person's record
    const person = findPersonByName(formData.Ledare);
    if (!person) return;

    // Auto-populate based on activity code
    let autoAmount: number | null = null;
    
    if (activityCode === "112") {
      // Use Timme (hourly rate)
      const timme = person.record.Timme;
      autoAmount = timme ? Number(timme) : null;
    } else if (activityCode === "113") {
      // Use Heldag (full day rate)
      const heldag = person.record.Heldag;
      autoAmount = heldag ? Number(heldag) : null;
    }

    // Only update if we found a valid amount and current Ersättning is 0
    if (autoAmount !== null && !isNaN(autoAmount) && formData.Ersättning === 0) {
      setFormData(prev => ({
        ...prev,
        Ersättning: autoAmount,
      }));
    }
  }, [formData.Ledare, formData.Aktivitetstyp, findPersonByName, getActivityAccount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const calculateTotal = (antal: number, ersattning: number) => {
    return antal * ersattning;
  };

  // Get unique values for filter options
  const availableCostCenters = useMemo(() => {
    const centers = [...new Set(compensations.map(c => getCostCenterDisplay(c.Kostnadsställe || "")).filter(Boolean))];
    return centers.sort();
  }, [compensations, getCostCenterDisplay]);

  // Filter and search logic
  const filteredCompensations = useMemo(() => {
    return compensations.filter(compensation => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const searchableText = [
          compensation.Ledare,
          compensation["Eventuell kommentar"],
          compensation["Upplagd av"],
          getCostCenterDisplay(compensation.Kostnadsställe || ""),
          getActivityDisplay(compensation.Aktivitetstyp || ""),
          compensation["Avser Mån/år"],
          compensation.Antal?.toString(),
          compensation.Ersättning?.toString()
        ].filter(Boolean).join(" ").toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Cost center filter
      if (filterCostCenter !== "all") {
        const displayCostCenter = getCostCenterDisplay(compensation.Kostnadsställe || "");
        if (displayCostCenter !== filterCostCenter) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "all" && compensation["Fortnox status"] !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [compensations, searchTerm, filterCostCenter, filterStatus, getCostCenterDisplay, getActivityDisplay]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterCostCenter("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = searchTerm || filterCostCenter !== "all" || filterStatus !== "all";

  const resetForm = () => {
    setFormData({
      "Upplagd av": settings.organization?.contactPerson || "",
      "Avser Mån/år": "",
      Ledare: "",
      Kostnadsställe: "",
      Aktivitetstyp: "",
      Antal: 0,
      Ersättning: 0,
      "Datum utbet": "",
      "Eventuell kommentar": "",
    });
  };

  const validateForm = (data: CompensationFormData) => {
    if (!data.Ledare || !data["Avser Mån/år"] || !data.Kostnadsställe) {
      alert(
        "Vänligen fyll i alla obligatoriska fält: Ledare, Månad/år och Kostnadsställe"
      );
      return false;
    }
    if (data.Antal <= 0 || data.Ersättning <= 0) {
      alert("Antal och Ersättning måste vara större än 0");
      return false;
    }
    if (data.Ledare.trim() === "") {
      alert("Vänligen välj en giltig ledare från listan");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm(formData)) return;

    const totalCompensation = calculateTotal(
      formData.Antal,
      formData.Ersättning
    );

    try {
      // Convert display text to codes for storage
      const submissionData = {
        ...formData,
        Kostnadsställe: getCostCenterCode(formData.Kostnadsställe),
        Aktivitetstyp: getActivityAccount(formData.Aktivitetstyp),
        "employee_id": "", // Will be auto-populated by service
        "Total ersättning": totalCompensation,
        "Fortnox status": "pending" as const,
      };

      await onAdd(submissionData);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add compensation:", error);
      alert("Kunde inte lägga till ersättning");
    }
  };

  const handleEdit = async (compensation: CompensationRecord) => {
    if (!validateForm(formData)) return;

    const totalCompensation = calculateTotal(
      formData.Antal,
      formData.Ersättning
    );

    try {
      // Convert display text to codes for storage
      const submissionData = {
        ...formData,
        Kostnadsställe: getCostCenterCode(formData.Kostnadsställe),
        Aktivitetstyp: getActivityAccount(formData.Aktivitetstyp),
        "Total ersättning": totalCompensation,
      };

      await onEdit(compensation.id!, submissionData);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error("Failed to edit compensation:", error);
      alert("Kunde inte uppdatera ersättning");
    }
  };

  const startEdit = (compensation: CompensationRecord) => {
    // Convert stored codes back to display text for editing
    setFormData({
      "Upplagd av": compensation["Upplagd av"] || "",
      "Avser Mån/år": compensation["Avser Mån/år"] || "",
      Ledare: compensation.Ledare || "",
      Kostnadsställe: getCostCenterDisplay(compensation.Kostnadsställe || ""),
      Aktivitetstyp: getActivityDisplay(compensation.Aktivitetstyp || ""),
      Antal: compensation.Antal || 0,
      Ersättning: compensation.Ersättning || 0,
      "Datum utbet": compensation["Datum utbet"] || "",
      "Eventuell kommentar": compensation["Eventuell kommentar"] || "",
    });
    setEditingId(compensation.id!);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Är du säker på att du vill ta bort denna ersättning?")) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error("Failed to delete compensation:", error);
        alert("Kunde inte ta bort ersättning");
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Laddar ersättningar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Sök..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          {/* Filter Dropdown Buttons */}
            <div className="flex gap-2 items-stretch">
            {/* Cost Center Filter */}
            <Select value={filterCostCenter} onValueChange={setFilterCostCenter}>
              <SelectTrigger className="w-46 text-sm h-10">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Kostnadsställe" />
              </SelectTrigger>
              <SelectContent className="text-sm">
              <SelectItem value="all" className="text-sm">Alla kostnadsställen</SelectItem>
              {availableCostCenters.map(center => (
                <SelectItem key={center} value={center} className="text-sm">
                {center}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28 text-sm h-10">
              <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="text-sm">
              <SelectItem value="all" className="text-sm">Alla status</SelectItem>
              <SelectItem value="pending" className="text-sm">Väntande</SelectItem>
              <SelectItem value="sent" className="text-sm">Skickad</SelectItem>
              <SelectItem value="completed" className="text-sm">Klar</SelectItem>
              <SelectItem value="error" className="text-sm">Fel</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="px-3 text-sm h-10"
            >
              <X className="h-3 w-3 mr-1" />
              Rensa
            </Button>
            </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Visar {filteredCompensations.length} av {compensations.length} ersättningar
            {searchTerm && ` • Sökning: "${searchTerm}"`}
            {filterCostCenter !== "all" && ` • Kostnadsställe: ${filterCostCenter}`}
            {filterStatus !== "all" && ` • Status: ${filterStatus}`}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-xs"></TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Upplagd av
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Månad/år
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Ledare
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Kostnadsställe
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Aktivitetstyp
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">Antal</TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Ersättning
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">Total</TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Datum utbet
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs">
                Kommentar
              </TableHead>
              <TableHead className="w-20 sticky right-0 text-xs">
                Åtgärder
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Existing Compensations */}
            {filteredCompensations
              .slice()
              .sort((a, b) => {
                const dateA = a["Avser Mån/år"] || "";
                const dateB = b["Avser Mån/år"] || "";

                if (dateA !== dateB) {
                  return dateB.localeCompare(dateA);
                }

                const personA = a.Ledare || "";
                const personB = b.Ledare || "";
                return personA.localeCompare(personB, "sv-SE");
              })
              .map((compensation) => (
                <CompensationTableRow
                  key={compensation.id}
                  compensation={compensation}
                  isEditing={editingId === compensation.id}
                  formData={formData}
                  onFormDataChange={setFormData}
                  onEdit={() => startEdit(compensation)}
                  onSave={() => handleEdit(compensation)}
                  onCancel={cancelEdit}
                  onDelete={() => handleDelete(compensation.id!)}
                  onDoubleClick={() => startEdit(compensation)}
                  formatCurrency={formatCurrency}
                  calculateTotal={calculateTotal}
                />
              ))}

            {/* Add Form Row */}
            <CompensationAddRow
              showAddForm={showAddForm}
              formData={formData}
              onFormDataChange={setFormData}
              onAdd={handleAdd}
              onCancel={() => {
                setShowAddForm(false);
                resetForm();
              }}
              onShowAddForm={() => {
                setShowAddForm(true);
                resetForm();
              }}
              formatCurrency={formatCurrency}
              calculateTotal={calculateTotal}
            />

            {/* Empty State */}
            {filteredCompensations.length === 0 && !showAddForm && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-12 text-muted-foreground text-xs"
                >
                  {hasActiveFilters 
                    ? "Inga ersättningar matchar de valda filtren"
                    : "Inga ersättningar registrerade"
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
