import { TableRow, TableCell } from "../../ui/table";
import { StatusDot } from "./StatusDot";
import { CompensationRowActions } from "./CompensationRowActions";
import type { CompensationRecord } from "../../../types/compensation";

interface MiniCompensationRowProps {
  compensation: CompensationRecord;
  onEdit: (compensation: CompensationRecord) => void;
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
  const handleEdit = () => {
    onEdit(compensation);
  };

  const handleDelete = () => {
    if (confirm("Är du säker på att du vill ta bort denna ersättning?")) {
      onDelete(compensation.id!);
    }
  };

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
          onSave={() => {}} // Not used in non-editing mode
          onCancel={() => {}} // Not used in non-editing mode
          onDelete={handleDelete}
        />
      </TableCell>
    </TableRow>
  );
}
