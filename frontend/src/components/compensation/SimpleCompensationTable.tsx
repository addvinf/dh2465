import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useSettings } from "../../contexts/SettingsContext";
import { useCostCenterSearch } from "../../hooks/useCostCenterSearch";
import { useActivityTypeSearch } from "../../hooks/useActivityTypeSearch";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const calculateTotal = (antal: number, ersattning: number) => {
    return antal * ersattning;
  };

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
            {compensations
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
            {compensations.length === 0 && !showAddForm && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-12 text-muted-foreground text-xs"
                >
                  Inga ersättningar registrerade
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
