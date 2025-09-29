import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Search,
  Download,
  Edit3,
  MoreHorizontal,
  RefreshCw,
  User,
} from "lucide-react";
import {
  type PersonnelRecord,
  type PersonnelTableProps,
  PERSONNEL_COLUMNS,
} from "../types/personnel";
import { toast } from "../hooks/use-toast";

export function PersonnelTable({
  data,
  onEdit,
  loading = false,
  searchTerm = "",
  onSearchChange,
}: PersonnelTableProps) {
  const visibleColumns = PERSONNEL_COLUMNS.filter((col) => col.visible);

  const filteredData = data.filter((record) => {
    if (!searchTerm) return true;

    const searchableColumns = PERSONNEL_COLUMNS.filter((col) => col.searchable);
    return searchableColumns.some((col) => {
      const value = record[col.key];
      return (
        value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  });

  const handleExport = () => {
    if (!data.length) return;

    // Create CSV with only visible columns
    const headers = visibleColumns.map((col) => col.label);
    const csvRows = [headers.join(",")].concat(
      filteredData.map((record) =>
        visibleColumns
          .map((col) => {
            const value = record[col.key];
            return JSON.stringify(value ?? "");
          })
          .join(",")
      )
    );

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "personal.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (record: PersonnelRecord) => {
    if (onEdit) {
      onEdit(record);
    } else {
      toast({
        description: "Redigeringsfunktion är inte implementerad än.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="financial-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Laddar personaldata...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">
            Personalregister ({filteredData.length} av {data.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Sök personal..."
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportera
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {data.length === 0
              ? "Ingen personaldata hittades"
              : "Inga resultat för sökningen"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className="whitespace-nowrap"
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record, idx) => (
                  <TableRow
                    key={record.id || idx}
                    className="hover:bg-accent/50"
                  >
                    <TableCell className="w-12">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className="whitespace-nowrap"
                      >
                        {column.type === "email" && record[column.key] ? (
                          <a
                            href={`mailto:${record[column.key]}`}
                            className="text-muted-foreground hover:underline"
                          >
                            {String(record[column.key])}
                          </a>
                        ) : (
                          <span
                            className={
                              column.key === "Kommentar" ||
                              column.key === "Personnummer"
                                ? "max-w-32 truncate block text-muted-foreground"
                                : ""
                            }
                          >
                            {String(record[column.key] || "")}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border-border"
                        >
                          <DropdownMenuItem onClick={() => handleEdit(record)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Redigera
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast({
                                description:
                                  "Lönehistorik är inte implementerad än.",
                                variant: "destructive",
                              })
                            }
                          >
                            Visa lönehistorik
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
