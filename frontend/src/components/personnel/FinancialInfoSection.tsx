import { CreditCard, AlertTriangle } from "lucide-react";
import { Input } from "../ui/input";
import type { PersonnelRecord } from "../../types/personnel";
import type { ValidationWarning } from "../../utils/personnelValidation";

interface FinancialInfoSectionProps {
  formData: Partial<PersonnelRecord>;
  getFieldWarnings: (fieldName: string) => ValidationWarning[];
  onInputChange: (
    key: keyof PersonnelRecord,
    value: string | boolean | number
  ) => void;
  onFieldBlur: (key: keyof PersonnelRecord) => void;
}

export function FinancialInfoSection({
  formData,
  getFieldWarnings,
  onInputChange,
  onFieldBlur,
}: FinancialInfoSectionProps) {
  return (
    <div className="bg-primary border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-green-600">
          Ekonomiska uppgifter
        </h3>
      </div>

      <div className="space-y-4">
        {/* Bank details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Clearingnummer
            </label>
            <Input
              type="text"
              value={formData.Clearingnr || ""}
              onChange={(e) => onInputChange("Clearingnr", e.target.value)}
              onBlur={() => onFieldBlur("Clearingnr")}
              placeholder="1234"
            />
            {getFieldWarnings("Clearingnr").map((warning, index) => (
              <div
                key={index}
                className="flex items-center gap-1 mt-1"
                role="alert"
                aria-live="polite"
                tabIndex={-1}
              >
                <AlertTriangle
                  className="h-3 w-3 text-red-500"
                  aria-hidden="true"
                />
                <span className="text-xs text-red-600">{warning.message}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Bankkonto
            </label>
            <Input
              type="text"
              value={formData.Bankkonto || ""}
              onChange={(e) => onInputChange("Bankkonto", e.target.value)}
              onBlur={() => onFieldBlur("Bankkonto")}
              placeholder="1234567890"
            />
            {getFieldWarnings("Bankkonto").map((warning, index) => (
              <div
                key={index}
                className="flex items-center gap-1 mt-1"
                role="alert"
                aria-live="polite"
                tabIndex={-1}
              >
                <AlertTriangle
                  className="h-3 w-3 text-orange-500"
                  aria-hidden="true"
                />
                <span className="text-xs text-orange-600">
                  {warning.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tax and social fees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Skattesats (%)
            </label>
            <Input
              type="number"
              step="0.1"
              value={
                formData["Skattesats"] !== undefined &&
                formData["Skattesats"] !== null
                  ? formData["Skattesats"]
                  : 30
              }
              onChange={(e) =>
                onInputChange("Skattesats", parseFloat(e.target.value) || 0)
              }
              onBlur={() => onFieldBlur("Skattesats")}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Sociala avgifter
            </label>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={!!formData["Sociala Avgifter"]}
                onChange={(e) =>
                  onInputChange("Sociala Avgifter", e.target.checked)
                }
                onBlur={() => onFieldBlur("Sociala Avgifter")}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Inkludera sociala avgifter
              </span>
            </div>
          </div>
        </div>

        {/* Employment date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-muted-foreground mb-1">
            Anställningsdag
          </label>
          <Input
            type="date"
            value={formData.Ändringsdag || ""}
            onChange={(e) => onInputChange("Ändringsdag", e.target.value)}
            onBlur={() => onFieldBlur("Ändringsdag")}
          />
          {getFieldWarnings("Ändringsdag").map((warning, index) => (
            <div
              key={index}
              className="flex items-center gap-1 mt-1"
              role="alert"
              aria-live="polite"
              tabIndex={-1}
            >
              <AlertTriangle
                className="h-3 w-3 text-red-500"
                aria-hidden="true"
              />
              <span className="text-xs text-red-600">{warning.message}</span>
            </div>
          ))}
        </div>

        {/* Salary information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Månadslön (kr)
            </label>
            <Input
              type="number"
              step="100"
              value={formData.Månad || ""}
              onChange={(e) => onInputChange("Månad", e.target.value)}
              onBlur={() => onFieldBlur("Månad")}
              placeholder="25000"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Timlön (kr)
            </label>
            <Input
              type="number"
              step="10"
              value={formData.Timme || ""}
              onChange={(e) => onInputChange("Timme", e.target.value)}
              onBlur={() => onFieldBlur("Timme")}
              placeholder="150"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Heldagslön (kr)
            </label>
            <Input
              type="number"
              step="100"
              value={formData.Heldag || ""}
              onChange={(e) => onInputChange("Heldag", e.target.value)}
              onBlur={() => onFieldBlur("Heldag")}
              placeholder="1200"
            />
          </div>
        </div>

        {/* Comments */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-muted-foreground mb-1">
            Kommentar
          </label>
          <Input
            type="text"
            value={formData.Kommentar || ""}
            onChange={(e) => onInputChange("Kommentar", e.target.value)}
            onBlur={() => onFieldBlur("Kommentar")}
            placeholder="Övriga anteckningar..."
          />
        </div>
      </div>
    </div>
  );
}
