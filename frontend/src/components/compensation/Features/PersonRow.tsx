import { ChevronDown, ChevronRight, Plus, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/Button";
import { MiniCompensationRow } from "./MiniCompensationRow";
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

  const calculateTotal = (antal: number, ersattning: number) => {
    return antal * ersattning;
  };

  const handleEditCompensation = async (
    id: string,
    updates: Partial<CompensationRecord>
  ) => {
    // Find the compensation and create the updated version
    const compensation = personComp.compensations.find((c) => c.id === id);
    if (compensation) {
      const updatedCompensation = { ...compensation, ...updates };
      await onEditCompensation(updatedCompensation);
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
          <div className="rounded-md mt-2 bg-muted/30">
            <Table>
              <TableHeader>
                <TableRow className="">
                  <TableHead className="h-9 text-xs w-8"></TableHead>
                  <TableHead className="h-9 text-xs">Upplagd av</TableHead>
                  <TableHead className="h-9 text-xs">Månad/år</TableHead>
                  <TableHead className="h-9 text-xs">Kostnadsställe</TableHead>
                  <TableHead className="h-9 text-xs">Aktivitetstyp</TableHead>
                  <TableHead className="h-9 text-xs">Antal</TableHead>
                  <TableHead className="h-9 text-xs">Ersättning</TableHead>
                  <TableHead className="h-9 text-xs">Total</TableHead>
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
                    <MiniCompensationRow
                      key={compensation.id}
                      compensation={compensation}
                      onEdit={handleEditCompensation}
                      onDelete={onDeleteCompensation}
                      formatCurrency={formatCurrency}
                      calculateTotal={calculateTotal}
                    />
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary for this person */}
          <div className="mt-3 flex justify-between items-center p-3 bg-muted/30 rounded-md">
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
