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

interface CompensationTableRowProps {
  compensation: CompensationRecord;
  isEditing: boolean;
  formData: CompensationFormData;
  onFormDataChange: (data: CompensationFormData) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDoubleClick: () => void;
  formatCurrency: (amount: number) => string;
  calculateTotal: (antal: number, ersattning: number) => number;
}

export function CompensationTableRow({
  compensation,
  isEditing,
  formData,
  onFormDataChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDoubleClick,
  formatCurrency,
  calculateTotal,
}: CompensationTableRowProps) {
  const updateFormField = (
    field: keyof CompensationFormData,
    value: string | number
  ) => {
    onFormDataChange({ ...formData, [field]: value });
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
            type="personnel-select"
            value={formData.Ledare}
            onChange={(value) => updateFormField("Ledare", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="cost-center-search"
            value={formData.Kostnadsställe}
            onChange={(value) => updateFormField("Kostnadsställe", value)}
          />
        </TableCell>
        <TableCell className="py-2 p-1">
          <CompensationFormField
            type="activity-type-search"
            value={formData.Aktivitetstyp}
            onChange={(value) => updateFormField("Aktivitetstyp", value)}
            useTooltip={true}
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
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      className="hover:bg-accent/50 cursor-pointer h-10"
      onDoubleClick={onDoubleClick}
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
        {compensation.Ledare || "-"}
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
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
