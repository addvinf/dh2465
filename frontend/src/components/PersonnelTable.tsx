import { Card, CardContent, CardHeader } from "./ui/card";
import { RefreshCw } from "lucide-react";
import { PersonnelTableHeader } from "./personnel/PersonnelTableHeader";
import { PersonnelTableBody } from "./personnel/PersonnelTableBody";
import {
  type PersonnelTableProps,
  type ViewMode,
  PERSONAL_VIEW_COLUMNS,
  FINANCIAL_VIEW_COLUMNS,
} from "../types/personnel";

export function PersonnelTable({
  data,
  onEdit,
  onToggleStatus,
  loading = false,
  searchTerm = "",
  onSearchChange,
  viewMode = "personal",
  onViewModeChange,
}: PersonnelTableProps) {
  const currentColumns =
    viewMode === "financial" ? FINANCIAL_VIEW_COLUMNS : PERSONAL_VIEW_COLUMNS;

  const filteredData = data.filter((record) => {
    if (!searchTerm) return true;

    const searchableColumns = currentColumns.filter((col) => col.searchable);
    return searchableColumns.some((col) => {
      const value = record[col.key];
      return (
        value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  });

  const handleExport = () => {
    if (!data.length) return;

    const visibleColumns = currentColumns.filter((col) => col.visible);

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
    a.download = `personal-${viewMode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
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
        <PersonnelTableHeader
          totalCount={data.length}
          filteredCount={filteredData.length}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange || (() => {})}
          onExport={handleExport}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </CardHeader>

      <CardContent>
        {filteredData.length === 0 && data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen personaldata hittades
          </div>
        ) : (
          <PersonnelTableBody
            data={filteredData}
            columns={currentColumns}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
          />
        )}
      </CardContent>
    </Card>
  );
}
