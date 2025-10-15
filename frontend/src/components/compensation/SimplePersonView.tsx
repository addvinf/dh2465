import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PersonRow } from "./Features/PersonRow";
import type {
  PersonCompensation,
  CompensationRecord,
} from "../../types/compensation";

interface SimplePersonViewProps {
  personCompensations: PersonCompensation[];
  period: { value: string; label: string };
  onAddCompensation: (personnelName: string) => void;
  onEditCompensation: (compensation: CompensationRecord) => void;
  onDeleteCompensation: (id: string) => void;
}

export function SimplePersonView({
  personCompensations,
  period,
  onAddCompensation,
  onEditCompensation,
  onDeleteCompensation,
}: SimplePersonViewProps) {
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(
    new Set()
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(amount);
  };

  const togglePersonExpanded = (personnelName: string) => {
    const newExpanded = new Set(expandedPersons);
    if (newExpanded.has(personnelName)) {
      newExpanded.delete(personnelName);
    } else {
      newExpanded.add(personnelName);
    }
    setExpandedPersons(newExpanded);
  };

  const totalAllCompensations = personCompensations.reduce(
    (sum, personComp) => sum + personComp.totalCompensation,
    0
  );

  if (personCompensations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="mb-4 text-muted-foreground">
            Inga ersättningar för {period.label}
          </p>
          <Button onClick={() => onAddCompensation("")} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Lägg till första ersättning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Ersättningar för {period.label}
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {formatCurrency(totalAllCompensations)}
            </p>
            <p className="text-sm text-muted-foreground">
              Total för {personCompensations.length} person(er)
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {personCompensations
            .slice()
            .sort((a, b) => {
              return a.personnelName.localeCompare(b.personnelName, "sv-SE");
            })
            .map((personComp) => {
              const isExpanded = expandedPersons.has(personComp.personnelName);

              return (
                <PersonRow
                  key={personComp.personnelName}
                  personComp={personComp}
                  isExpanded={isExpanded}
                  onToggleExpanded={() =>
                    togglePersonExpanded(personComp.personnelName)
                  }
                  onAddCompensation={onAddCompensation}
                  onEditCompensation={onEditCompensation}
                  onDeleteCompensation={onDeleteCompensation}
                />
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
