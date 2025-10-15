import { Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "../../ui/Button";

interface CompensationRowActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function CompensationRowActions({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: CompensationRowActionsProps) {
  if (isEditing) {
    return (
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <span className="sr-only">Spara</span>
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <span className="sr-only">Avbryt</span>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex space-x-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
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
          onDelete();
        }}
        className="h-8 w-8 p-0 hover:bg-muted"
      >
        <span className="sr-only">Ta bort</span>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
