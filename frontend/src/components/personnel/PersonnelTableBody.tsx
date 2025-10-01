import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { User, Check, X } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PositionBadge } from "./PositionBadge";
import { PersonnelActionColumn } from "./PersonnelActionColumn";
import type { PersonnelRecord, PersonnelColumn } from "../../types/personnel";

interface PersonnelTableBodyProps {
  data: PersonnelRecord[];
  columns: PersonnelColumn[];
  onEdit?: (record: PersonnelRecord) => void;
  onToggleStatus?: (record: PersonnelRecord) => void;
  onDelete?: (record: PersonnelRecord) => void;
}

export function PersonnelTableBody({
  data,
  columns,
  onEdit,
  onToggleStatus,
  onDelete,
}: PersonnelTableBodyProps) {
  const visibleColumns = columns.filter((col) => col.visible);

  const renderCellContent = (
    record: PersonnelRecord,
    column: PersonnelColumn
  ) => {
    const value = record[column.key];

    switch (column.type) {
      case "badge":
        if (column.key === "Aktiv") {
          return <StatusBadge isActive={!!value} />;
        }
        if (column.key === "Befattning") {
          return <PositionBadge position={String(value || "")} />;
        }
        return String(value || "");

      case "email":
        return value ? (
          <a
            href={`mailto:${value}`}
            className="text-muted-foreground hover:underline"
          >
            {String(value)}
          </a>
        ) : (
          ""
        );

      case "boolean":
        return value ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-gray-400" />
        );

      case "number":
        // Handle different number types
        if (column.key === "Skattesats") {
          return typeof value === "number" ? `${value}%` : String(value || "");
        } else if (
          column.key === "Månad" ||
          column.key === "Timme" ||
          column.key === "Heldag"
        ) {
          return typeof value === "number"
            ? `${value} kr`
            : String(value || "");
        }
        return String(value || "");

      case "date":
        if (value && typeof value === "string") {
          try {
            const date = new Date(value);
            return date.toLocaleDateString("sv-SE"); // Swedish date format
          } catch {
            return String(value);
          }
        }
        return "";

      default:
        return (
          <span
            className={
              column.key === "Kommentar" || column.key === "Personnummer"
                ? "max-w-32 truncate block text-muted-foreground"
                : ""
            }
          >
            {String(value || "")}
          </span>
        );
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Inga resultat för sökningen
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            {visibleColumns.map((column) => (
              <TableHead key={String(column.key)} className="whitespace-nowrap">
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, idx) => (
            <TableRow key={record.id || idx} className="hover:bg-accent/50">
              <TableCell className="w-12">
                <User className="h-4 w-4 text-muted-foreground" />
              </TableCell>
              {visibleColumns.map((column) => (
                <TableCell
                  key={String(column.key)}
                  className="whitespace-nowrap"
                >
                  {renderCellContent(record, column)}
                </TableCell>
              ))}
              <TableCell>
                <PersonnelActionColumn
                  record={record}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
