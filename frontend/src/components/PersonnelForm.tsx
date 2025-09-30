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
      onSubmit(formData);
    }
  };

  const handleInputChange = (key: keyof PersonnelRecord, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const getInputType = (columnType?: string): string => {
    switch (columnType) {
      case "email":
        return "email";
      case "number":
        return "number";
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
                      handleInputChange(column.key, e.target.value)
                    }
                    className={
                      errors[String(column.key)] ? "border-destructive" : ""
                    }
                    placeholder={`Ange ${column.label.toLowerCase()}`}
                  />
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
