import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/Button";
import type {
  PersonCompensationCardProps,
  CompensationRecord,
} from "../../types/compensation";

export function PersonCompensationCard({
  personCompensation,
  period,
  onEditCompensation,
  onDeleteCompensation,
  onAddCompensation,
}: PersonCompensationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const getFortnoxStatusIcon = (
    status?: CompensationRecord["Fortnox status"]
  ) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getFortnoxStatusText = (
    status?: CompensationRecord["Fortnox status"]
  ) => {
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
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {personCompensation.personnelName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {period.label} • {personCompensation.compensations.length}{" "}
                ersättning(ar)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(personCompensation.totalCompensation)}
              </p>
              <p className="text-sm text-muted-foreground">Total ersättning</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onAddCompensation(personCompensation.personnelName)
              }
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Lägg till</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {personCompensation.compensations.map((compensation) => (
              <div
                key={compensation.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
              >
                <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {compensation.Aktivitetstyp}
                    </p>
                    <p className="text-muted-foreground">
                      {compensation.Kostnadsställe}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground">{compensation.Antal} st</p>
                    <p className="text-muted-foreground">Antal</p>
                  </div>
                  <div>
                    <p className="text-foreground">
                      {formatCurrency(compensation.Ersättning)}
                    </p>
                    <p className="text-muted-foreground">Per enhet</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(compensation["Total ersättning"] || 0)}
                    </p>
                    <p className="text-muted-foreground">Totalt</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getFortnoxStatusIcon(compensation["Fortnox status"])}
                    <span className="text-xs text-muted-foreground">
                      {getFortnoxStatusText(compensation["Fortnox status"])}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCompensation(compensation)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCompensation(compensation.id!)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {personCompensation.compensations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Ingen ersättning registrerad för denna period</p>
                <Button
                  variant="outline"
                  onClick={() =>
                    onAddCompensation(personCompensation.personnelName)
                  }
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till första ersättning
                </Button>
              </div>
            )}

            {personCompensation.compensations.length > 0 && (
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">
                    Total för {period.label}:
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(personCompensation.totalCompensation)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
