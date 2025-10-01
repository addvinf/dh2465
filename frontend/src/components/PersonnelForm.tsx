import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  type PersonnelFormProps,
  type PersonnelRecord,
  FORM_COLUMNS,
} from "../types/personnel";

export function PersonnelForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  loading = false,
}: PersonnelFormProps) {
  const [formData, setFormData] =
    useState<Partial<PersonnelRecord>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen]); // Only depend on isOpen, not initialData

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    const requiredFields = ["Förnamn", "Efternamn", "E-post"];
    requiredFields.forEach((field) => {
      if (!formData[field as keyof PersonnelRecord]) {
        newErrors[field] = "Detta fält är obligatoriskt";
      }
    });

    // Email validation
    if (formData["E-post"]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData["E-post"])) {
        newErrors["E-post"] = "Ogiltig e-postadress";
      }
    }

    // Personal number validation (basic format check)
    if (formData["Personnummer"]) {
      const pnrRegex = /^\d{6,8}-?\d{4}$/;
      if (!pnrRegex.test(formData["Personnummer"])) {
        newErrors["Personnummer"] = "Ogiltigt personnummer format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Ensure new persons are always set to active
      const submissionData = {
        ...formData,
        Aktiv: initialData.id ? formData.Aktiv : true, // Only set to true for new persons
      };
      onSubmit(submissionData);
    }
  };

  const handleInputChange = (
    key: keyof PersonnelRecord,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[String(key)]) {
      setErrors((prev) => ({ ...prev, [String(key)]: "" }));
    }
  };

  const handleCheckboxChange = (
    key: keyof PersonnelRecord,
    checked: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [key]: checked }));
    // Clear error when user changes checkbox
    if (errors[String(key)]) {
      setErrors((prev) => ({ ...prev, [String(key)]: "" }));
    }
  };

  const getInputType = (columnType?: string): string => {
    switch (columnType) {
      case "email":
        return "email";
      case "number":
        return "number";
      case "date":
        return "date";
      default:
        return "text";
    }
  };

  const isRequired = (key: string): boolean => {
    return ["Förnamn", "Efternamn", "E-post"].includes(key);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData.id ? "Redigera person" : "Lägg till person"}
          </DialogTitle>
          <DialogDescription>
            {initialData.id
              ? "Uppdatera informationen för denna person."
              : "Fyll i informationen för att lägga till en ny person i systemet."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORM_COLUMNS.map((column) => (
                <div key={String(column.key)} className="flex flex-col">
                  <label className="text-sm font-medium text-muted-foreground mb-1">
                    {column.label}
                    {isRequired(String(column.key)) && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>

                  {column.type === "boolean" ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="checkbox"
                        checked={!!formData[column.key]}
                        onChange={(e) =>
                          handleCheckboxChange(column.key, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground">
                        {column.key === "Aktiv"
                          ? "Person är aktiv"
                          : column.key === "Sociala Avgifter"
                          ? "Inkludera sociala avgifter"
                          : "Ja"}
                      </span>
                    </div>
                  ) : (
                    <Input
                      type={getInputType(column.type)}
                      value={
                        typeof formData[column.key] === "boolean"
                          ? ""
                          : (formData[column.key] as
                              | string
                              | number
                              | undefined) || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          column.key,
                          column.type === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value
                        )
                      }
                      className={
                        errors[String(column.key)] ? "border-destructive" : ""
                      }
                      placeholder={`Ange ${column.label.toLowerCase()}`}
                      step={column.type === "number" ? "0.1" : undefined}
                    />
                  )}

                  {errors[String(column.key)] && (
                    <span className="text-xs text-destructive mt-1">
                      {errors[String(column.key)]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sparar..." : initialData.id ? "Uppdatera" : "Lägg till"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
