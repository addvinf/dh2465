import { AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";
import type { ValidationWarning } from "../../utils/personnelValidation";

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
}

export function ValidationWarnings({ warnings }: ValidationWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">
          Formatvarningar ({warnings.length})
        </span>
      </div>
      <div className="space-y-1">
        {warnings.map((warning, index) => (
          <div key={index} className="flex items-center gap-2">
            <Badge
              variant={
                warning.severity === "error" ? "destructive" : "secondary"
              }
              className="text-xs"
            >
              {warning.field}
            </Badge>
            <span className="text-xs text-orange-700">{warning.message}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-orange-600 mt-2">
        Du kan fortfarande spara, men kontrollera att informationen är korrekt
        för Fortnox-integration.
      </p>
    </div>
  );
}
