import { useState } from "react";
import { User, AlertTriangle, Check } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  KOSTNADSSTALLE_OPTIONS,
  BEFATTNING_OPTIONS,
} from "../../constants/personnelForm";
import type { PersonnelRecord } from "../../types/personnel";
import type { ValidationWarning } from "../../utils/personnelValidation";

interface PersonalInfoSectionProps {
  formData: Partial<PersonnelRecord>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PersonnelRecord>>>;
  errors: Record<string, string>;
  getFieldWarnings: (fieldName: string) => ValidationWarning[];
  onInputChange: (
    key: keyof PersonnelRecord,
    value: string | boolean | number
  ) => void;
  onFieldBlur: (key: keyof PersonnelRecord) => void;
}

export function PersonalInfoSection({
  formData,
  setFormData,
  errors,
  getFieldWarnings,
  onInputChange,
  onFieldBlur,
}: PersonalInfoSectionProps) {
  const [customKostnadsställe, setCustomKostnadsställe] = useState(() => {
    const kostnadExists = KOSTNADSSTALLE_OPTIONS.some(
      (opt) => opt.value === formData.Kostnadsställe
    );
    return !kostnadExists && !!formData.Kostnadsställe;
  });

  const [customBefattning, setCustomBefattning] = useState(() => {
    const befattningExists = BEFATTNING_OPTIONS.some(
      (opt) => opt.value === formData.Befattning
    );
    return !befattningExists && !!formData.Befattning;
  });

  const handleSelectChange = (key: keyof PersonnelRecord, value: string) => {
    if (key === "Kostnadsställe" && value === "custom") {
      setCustomKostnadsställe(true);
      setFormData((prev) => ({ ...prev, [key]: "" }));
    } else if (key === "Befattning" && value === "custom") {
      setCustomBefattning(true);
      setFormData((prev) => ({ ...prev, [key]: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (key === "Kostnadsställe") setCustomKostnadsställe(false);
      if (key === "Befattning") setCustomBefattning(false);
    }
  };

  return (
    <div className="bg-primary rounded-lg p-4 mt-3">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-secondary" />
        <h3 className="text-lg font-semibold text-secondary">
          Personuppgifter
        </h3>
      </div>

      <div className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Förnamn
              <span className="text-destructive ml-1">*</span>
            </label>
            <Input
              type="text"
              value={formData.Förnamn || ""}
              onChange={(e) => onInputChange("Förnamn", e.target.value)}
              className={errors.Förnamn ? "border-destructive" : ""}
              placeholder=""
            />
            {errors.Förnamn && (
              <span className="text-xs text-destructive mt-1">
                {errors.Förnamn}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Efternamn
              <span className="text-destructive ml-1">*</span>
            </label>
            <Input
              type="text"
              value={formData.Efternamn || ""}
              onChange={(e) => onInputChange("Efternamn", e.target.value)}
              className={errors.Efternamn ? "border-destructive" : ""}
              placeholder=""
            />
            {errors.Efternamn && (
              <span className="text-xs text-destructive mt-1">
                {errors.Efternamn}
              </span>
            )}
          </div>
        </div>

        {/* Personal number */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-muted-foreground mb-1">
            Personnummer
          </label>
          <Input
            type="text"
            value={formData.Personnummer || ""}
            onChange={(e) => onInputChange("Personnummer", e.target.value)}
            onBlur={() => onFieldBlur("Personnummer")}
            placeholder="ÅÅÅÅMMDD-XXXX"
          />
          {getFieldWarnings("Personnummer").map((warning, index) => (
            <div
              key={index}
              className="flex items-center gap-1 mt-1"
              role="alert"
              aria-live="polite"
              tabIndex={-1}
            >
              {warning.severity === "error" ? (
                <AlertTriangle
                  className="h-3 w-3 text-red-500"
                  aria-hidden="true"
                />
              ) : (
                <Check className="h-3 w-3 text-orange-500" aria-hidden="true" />
              )}
              <span
                className={`text-xs ${
                  warning.severity === "error"
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              >
                {warning.message}
              </span>
            </div>
          ))}
        </div>

        {/* Contact information */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-muted-foreground mb-1">
            E-post
            <span className="text-destructive ml-1">*</span>
          </label>
          <Input
            type="email"
            value={formData["E-post"] || ""}
            onChange={(e) => onInputChange("E-post", e.target.value)}
            className={errors["E-post"] ? "border-destructive" : ""}
            placeholder=""
          />
          {errors["E-post"] && (
            <span className="text-xs text-destructive mt-1">
              {errors["E-post"]}
            </span>
          )}
        </div>

        {/* Address fields */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-muted-foreground mb-1">
            Adress
          </label>
          <Input
            type="text"
            value={formData.Adress || ""}
            onChange={(e) => onInputChange("Adress", e.target.value)}
            placeholder=""
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Postnummer
            </label>
            <Input
              type="text"
              value={formData.Postnr || ""}
              onChange={(e) => onInputChange("Postnr", e.target.value)}
              placeholder="123 45"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Postort
            </label>
            <Input
              type="text"
              value={formData.Postort || ""}
              onChange={(e) => onInputChange("Postort", e.target.value)}
              placeholder=""
            />
          </div>
        </div>

        {/* Role and department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Befattning
            </label>
            {customBefattning ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={formData.Befattning || ""}
                  onChange={(e) => onInputChange("Befattning", e.target.value)}
                  placeholder="Ange egen befattning"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomBefattning(false);
                    setFormData((prev) => ({ ...prev, Befattning: "" }));
                  }}
                >
                  Välj från lista
                </Button>
              </div>
            ) : (
              <Select
                value={formData.Befattning || ""}
                onValueChange={(value: string) =>
                  handleSelectChange("Befattning", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj befattning" />
                </SelectTrigger>
                <SelectContent>
                  {BEFATTNING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Annan befattning...</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-1">
              Kostnadsställe
            </label>
            {customKostnadsställe ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={formData.Kostnadsställe || ""}
                  onChange={(e) =>
                    onInputChange("Kostnadsställe", e.target.value)
                  }
                  placeholder="Ange eget kostnadsställe"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomKostnadsställe(false);
                    setFormData((prev) => ({ ...prev, Kostnadsställe: "" }));
                  }}
                >
                  Välj från lista
                </Button>
              </div>
            ) : (
              <Select
                value={formData.Kostnadsställe || ""}
                onValueChange={(value: string) =>
                  handleSelectChange("Kostnadsställe", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kostnadsställe" />
                </SelectTrigger>
                <SelectContent>
                  {KOSTNADSSTALLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    Annat kostnadsställe...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
