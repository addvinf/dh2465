import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Edit3,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toast } from "../../hooks/use-toast";
import type { PersonnelRecord } from "../../types/personnel";

interface PersonnelActionColumnProps {
  record: PersonnelRecord;
  onEdit?: (record: PersonnelRecord) => void;
  onToggleStatus?: (record: PersonnelRecord) => void;
  onDelete?: (record: PersonnelRecord) => void;
}

export function PersonnelActionColumn({
  record,
  onEdit,
  onToggleStatus,
  onDelete,
}: PersonnelActionColumnProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(record);
    } else {
      toast({
        description: "Redigeringsfunktion är inte implementerad än.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(record);
    } else {
      toast({
        description: "Status-toggle är inte implementerad än.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(record);
    } else {
      toast({
        description: "Ta bort-funktion är inte implementerad än.",
        variant: "destructive",
      });
    }
  };

  const StatusIcon = record.Aktiv ? ToggleRight : ToggleLeft;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit3 className="mr-2 h-4 w-4" />
          Redigera
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleStatus}>
          <StatusIcon className="mr-2 h-4 w-4" />
          {record.Aktiv ? "Sätt som inaktiv" : "Sätt som aktiv"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            toast({
              description: "Lönehistorik är inte implementerad än.",
              variant: "destructive",
            })
          }
        >
          Visa lönehistorik
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Ta bort person
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
