import { ChevronDown, ChevronRight, Plus, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/Button";

import { CompensationRowActions } from "./CompensationRowActions";
import type {
  PersonCompensation,
  CompensationRecord,
} from "../../../types/compensation";

interface PersonRowProps {
  personComp: PersonCompensation;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAddCompensation: (personnelName: string) => void;
  onEditCompensation: (compensation: CompensationRecord) => void;
  onDeleteCompensation: (id: string) => void;
}

export function PersonRow({
  personComp,
  isExpanded,
  onToggleExpanded,
  onAddCompensation,
  onEditCompensation,
  onDeleteCompensation,
}: PersonRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const getStatusBadge = (status?: CompensationRecord["Fortnox status"]) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full";

    switch (status) {
      case "sent":
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      case "error":
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      case "pending":
      default:
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
    }
  };

  const getStatusText = (status?: CompensationRecord["Fortnox status"]) => {
    switch (status) {
      case "sent":
        return "Skickad";
      case "error":
        return "Fel";
      case "pending":
      default:
        return "Väntande";
    }
  };

  return (
    <>
      {/* Person Header Row */}
      <div
        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/50"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <User className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="font-medium text-sm">{personComp.personnelName}</h3>
            <p className="text-xs text-muted-foreground">
              {personComp.compensations.length} ersättning(ar)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-semibold text-sm">
              {formatCurrency(personComp.totalCompensation)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddCompensation(personComp.personnelName);
            }}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Lägg till
          </Button>
        </div>
      </div>

      {/* Expanded Compensation Details */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="rounded-md border mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="h-9 text-xs">Aktivitetstyp</TableHead>
                  <TableHead className="h-9 text-xs">Avser Mån/År</TableHead>
                  <TableHead className="h-9 text-xs">Kostnadsställe</TableHead>
                  <TableHead className="h-9 text-xs">Antal</TableHead>
                  <TableHead className="h-9 text-xs">Ersättning</TableHead>
                  <TableHead className="h-9 text-xs">Total</TableHead>
                  <TableHead className="h-9 text-xs">Status</TableHead>
                  <TableHead className="h-9 text-xs">Datum utbet</TableHead>
                  <TableHead className="h-9 text-xs">Kommentar</TableHead>
                  <TableHead className="h-9 text-xs">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personComp.compensations
                  .slice()
                  .sort((a, b) => {
                    const dateA = a["Avser Mån/år"] || "";
                    const dateB = b["Avser Mån/år"] || "";

                    if (dateA !== dateB) {
                      return dateB.localeCompare(dateA);
                    }

                    const activityA = a.Aktivitetstyp || "";
                    const activityB = b.Aktivitetstyp || "";
                    return activityA.localeCompare(activityB, "sv-SE");
                  })
                  .map((compensation) => (
                    <TableRow
                      key={compensation.id}
                      className="hover:bg-muted/30 h-10 cursor-pointer"
                      onDoubleClick={() => onEditCompensation(compensation)}
                    >
                      <TableCell className="py-2 text-xs font-medium">
                        {compensation.Aktivitetstyp || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {compensation["Avser Mån/år"] || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {compensation.Kostnadsställe || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {compensation.Antal || 0}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {formatCurrency(compensation.Ersättning || 0)}
                      </TableCell>
                      <TableCell className="py-2 text-xs font-medium">
                        {formatCurrency(
                          (compensation.Antal || 0) *
                            (compensation.Ersättning || 0)
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={getStatusBadge(
                            compensation["Fortnox status"]
                          )}
                        >
                          {getStatusText(compensation["Fortnox status"])}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {compensation["Datum utbet"]
                          ? new Date(
                              compensation["Datum utbet"]
                            ).toLocaleDateString("sv-SE")
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs max-w-[120px] truncate">
                        {compensation["Eventuell kommentar"] || "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        <CompensationRowActions
                          compensation={compensation}
                          onEdit={onEditCompensation}
                          onDelete={onDeleteCompensation}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary for this person */}
          <div className="mt-3 flex justify-between items-center p-3 bg-muted/10 rounded-md">
            <span className="text-xs font-medium text-muted-foreground">
              Total för {personComp.personnelName}:
            </span>
            <span className="text-sm font-semibold">
              {formatCurrency(personComp.totalCompensation)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
