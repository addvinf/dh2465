import { useState } from "react";
import { TableRow, TableCell } from "../../ui/table";
import { StatusDot } from "./StatusDot";
import { CompensationRowActions } from "./CompensationRowActions";
import { CompensationFormField } from "./CompensationFormField";
import type { CompensationRecord } from "../../../types/compensation";

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

interface MiniCompensationRowProps {
  compensation: CompensationRecord;
  onEdit: (id: string, updates: Partial<CompensationRecord>) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
  calculateTotal: (antal: number, ersattning: number) => number;
}

export function MiniCompensationRow({
  compensation,
  onEdit,
  onDelete,
  formatCurrency,
  calculateTotal,
}: MiniCompensationRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CompensationFormData>({
    "Upplagd av": compensation["Upplagd av"] || "",
    "Avser Mån/år": compensation["Avser Mån/år"] || "",
    Ledare: compensation.Ledare || "",
    Kostnadsställe: compensation.Kostnadsställe || "",
    Aktivitetstyp: compensation.Aktivitetstyp || "",
    Antal: compensation.Antal || 0,
    Ersättning: compensation.Ersättning || 0,
    "Datum utbet": compensation["Datum utbet"] || "",
    "Eventuell kommentar": compensation["Eventuell kommentar"] || "",
  });

  const updateFormField = (
    field: keyof CompensationFormData,
    value: string | number
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleEdit = () => {
    setFormData({
      "Upplagd av": compensation["Upplagd av"] || "",
      "Avser Mån/år": compensation["Avser Mån/år"] || "",
      Ledare: compensation.Ledare || "",
      Kostnadsställe: compensation.Kostnadsställe || "",
      Aktivitetstyp: compensation.Aktivitetstyp || "",
      Antal: compensation.Antal || 0,
      Ersättning: compensation.Ersättning || 0,
      "Datum utbet": compensation["Datum utbet"] || "",
      "Eventuell kommentar": compensation["Eventuell kommentar"] || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const totalCompensation = calculateTotal(
        formData.Antal,
        formData.Ersättning
      );

      const updates: Partial<CompensationRecord> = {
        ...formData,
        "Total ersättning": totalCompensation,
      };

      await onEdit(compensation.id!, updates);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save compensation:", error);
      alert("Kunde inte spara ersättning");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      "Upplagd av": compensation["Upplagd av"] || "",
      "Avser Mån/år": compensation["Avser Mån/år"] || "",
      Ledare: compensation.Ledare || "",
      Kostnadsställe: compensation.Kostnadsställe || "",
      Aktivitetstyp: compensation.Aktivitetstyp || "",
      Antal: compensation.Antal || 0,
      Ersättning: compensation.Ersättning || 0,
      "Datum utbet": compensation["Datum utbet"] || "",
      "Eventuell kommentar": compensation["Eventuell kommentar"] || "",
    });
  };

  const handleDelete = () => {
    if (confirm("Är du säker på att du vill ta bort denna ersättning?")) {
      onDelete(compensation.id!);
    }
  };

  if (isEditing) {
    return (
      <TableRow className="bg-muted/50 h-10">
        <TableCell className="p-1 w-8" align="center">
          <StatusDot status="pending" />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="text"
            value={formData["Upplagd av"]}
            onChange={(value) => updateFormField("Upplagd av", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="month-select"
            value={formData["Avser Mån/år"]}
            onChange={(value) => updateFormField("Avser Mån/år", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="cost-center-select"
            value={formData.Kostnadsställe}
            onChange={(value) => updateFormField("Kostnadsställe", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="text"
            value={formData.Aktivitetstyp}
            onChange={(value) => updateFormField("Aktivitetstyp", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="number"
            value={formData.Antal}
            onChange={(value) => updateFormField("Antal", value)}
            min="0"
            step="1"
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="number"
            value={formData.Ersättning}
            onChange={(value) => updateFormField("Ersättning", value)}
            min="0"
            step="1"
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <span className="font-medium text-xs">
            {formatCurrency(
              calculateTotal(formData.Antal, formData.Ersättning)
            )}
          </span>
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="date"
            value={formData["Datum utbet"]}
            onChange={(value) => updateFormField("Datum utbet", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="text"
            value={formData["Eventuell kommentar"]}
            onChange={(value) => updateFormField("Eventuell kommentar", value)}
          />
        </TableCell>
        <TableCell className="py-2 sticky right-0">
          <CompensationRowActions
            isEditing={true}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      className="hover:bg-accent/50 cursor-pointer h-10"
      onDoubleClick={handleEdit}
    >
      <TableCell className="w-8 py-2">
        <StatusDot status={compensation["Fortnox status"]} />
      </TableCell>
      <TableCell className="py-2 text-xs whitespace-nowrap">
        {compensation["Upplagd av"] || "-"}
      </TableCell>
      <TableCell className="py-2 text-xs whitespace-nowrap">
        {compensation["Avser Mån/år"]
          ? new Date(compensation["Avser Mån/år"] + "-01").toLocaleDateString(
              "sv-SE",
              { month: "long", year: "numeric" }
            )
          : "-"}
      </TableCell>
      <TableCell className="py-2 text-xs whitespace-nowrap">
        {compensation.Kostnadsställe || "-"}
      </TableCell>
      <TableCell className="py-2 text-xs whitespace-nowrap">
        {compensation.Aktivitetstyp || "-"}
      </TableCell>
      <TableCell className="py-2 text-xs">{compensation.Antal || 0}</TableCell>
      <TableCell className="py-2 text-xs">
        {formatCurrency(compensation.Ersättning || 0)}
      </TableCell>
      <TableCell className="py-2 text-xs font-medium">
        {formatCurrency(
          calculateTotal(compensation.Antal || 0, compensation.Ersättning || 0)
        )}
      </TableCell>
      <TableCell className="py-2 text-xs">
        {compensation["Datum utbet"]
          ? new Date(compensation["Datum utbet"]).toLocaleDateString("sv-SE")
          : "-"}
      </TableCell>
      <TableCell className="py-2 text-xs max-w-[120px] truncate">
        {compensation["Eventuell kommentar"] || "-"}
      </TableCell>
      <TableCell className="py-2 sticky right-0">
        <CompensationRowActions
          isEditing={false}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      </TableCell>
    </TableRow>
  );
}
