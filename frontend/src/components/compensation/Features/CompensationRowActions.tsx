import { Edit, Trash2 } from "lucide-react";
import { Button } from "../../ui/Button";
import type { CompensationRecord } from "../../../types/compensation";

interface CompensationRowActionsProps {
  compensation: CompensationRecord;
  onEdit: (compensation: CompensationRecord) => void;
  onDelete: (id: string) => void;
}

export function CompensationRowActions({
  compensation,
  onEdit,
  onDelete,
}: CompensationRowActionsProps) {
  return (
    <div className="flex space-x-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(compensation);
        }}
        className="h-8 w-8 p-0 hover:bg-muted"
      >
        <span className="sr-only">Redigera</span>
        <Edit className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(compensation.id!);
        }}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <span className="sr-only">Ta bort</span>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
