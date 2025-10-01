import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { AlertTriangle, User, CreditCard, Check, Plus } from "lucide-react";
import {
  type PersonnelFormProps,
  type PersonnelRecord,
} from "../types/personnel";

// Mock data for dropdowns (will be replaced with settings later)
const KOSTNADSSTALLE_OPTIONS = [
  { value: "101", label: "1 - Fotboll" },
  { value: "102", label: "2 - Pingis" },
  { value: "103", label: "3 - Admin" },
];

const BEFATTNING_OPTIONS = [
  { value: "Domare", label: "Domare" },
  { value: "Tränare", label: "Tränare" },
  { value: "Admin", label: "Admin" },
];

interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning" | "error";
}

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
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [customKostnadsställe, setCustomKostnadsställe] = useState(false);
  const [customBefattning, setCustomBefattning] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
      setWarnings([]);

      // Check if we need custom fields
      const kostnadExists = KOSTNADSSTALLE_OPTIONS.some(
        (opt) => opt.value === initialData.Kostnadsställe
      );
      const befattningExists = BEFATTNING_OPTIONS.some(
        (opt) => opt.value === initialData.Befattning
      );

      setCustomKostnadsställe(!kostnadExists && !!initialData.Kostnadsställe);
      setCustomBefattning(!befattningExists && !!initialData.Befattning);
    }
  }, [isOpen]); // Remove initialData dependency to prevent infinite re-renders

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const validatePersonnummer = (pnr: string): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const cleaned = pnr.replace(/[-\s]/g, "");

    if (cleaned.length === 10) {
      warnings.push({
        field: "Personnummer",
        message:
          "10-siffrigt personnummer kommer att konverteras till 12-siffrigt format",
        severity: "warning",
      });
    } else if (cleaned.length !== 12 || !/^\d+$/.test(cleaned)) {
      warnings.push({
        field: "Personnummer",
        message: "Personnummer ska vara 12 siffror (YYYYMMDD-XXXX)",
        severity: "error",
      });
    }

    return warnings;
  };

  const validateClearingnr = (clearingnr: string): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const cleaned = clearingnr.replace(/[-\s]/g, "");

    if (cleaned.length < 4 || cleaned.length > 5 || !/^\d+$/.test(cleaned)) {
      warnings.push({
        field: "Clearingnr",
        message: "Clearingnummer ska vara 4-5 siffror",
        severity: "error",
      });
    }

    return warnings;
  };

  const validateBankkonto = (bankkonto: string): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const cleaned = bankkonto.replace(/[-\s]/g, "");

    if (cleaned.length < 7 || cleaned.length > 11 || !/^\d+$/.test(cleaned)) {
      warnings.push({
        field: "Bankkonto",
        message: "Bankkontonummer ska vara 7-11 siffror",
        severity: "warning",
      });
    }

    return warnings;
  };

  const validateDate = (
    date: string,
    fieldName: string
  ): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      warnings.push({
        field: fieldName,
        message: "Datum ska vara i format YYYY-MM-DD",
        severity: "error",
      });
    } else if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        warnings.push({
          field: fieldName,
          message: "Ogiltigt datum",
          severity: "error",
        });
      }
    }

    return warnings;
  };

  const validateAllFields = (): ValidationWarning[] => {
    let allWarnings: ValidationWarning[] = [];

    if (formData.Personnummer) {
      allWarnings = [
        ...allWarnings,
        ...validatePersonnummer(formData.Personnummer),
      ];
    }

    if (formData.Clearingnr) {
      allWarnings = [
        ...allWarnings,
        ...validateClearingnr(formData.Clearingnr),
      ];
    }

    if (formData.Bankkonto) {
      allWarnings = [...allWarnings, ...validateBankkonto(formData.Bankkonto)];
    }

    if (formData.Ändringsdag) {
      allWarnings = [
        ...allWarnings,
        ...validateDate(formData.Ändringsdag, "Ändringsdag"),
      ];
    }

    return allWarnings;
  };

  const normalizePersonnummer = (pnr: string): string => {
    const cleaned = pnr.replace(/[-\s]/g, "");

    if (cleaned.length === 10) {
      // Convert 10-digit to 12-digit by adding century
      const year = parseInt(cleaned.substring(0, 2));
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const cutoff = currentYear - currentCentury + 10; // 10 years in the future

      const century = year <= cutoff ? currentCentury : currentCentury - 100;
      return `${century + year}${cleaned.substring(2, 6)}-${cleaned.substring(
        6
      )}`;
    }

    // Format 12-digit number
    if (cleaned.length === 12) {
      return `${cleaned.substring(0, 8)}-${cleaned.substring(8)}`;
    }

    return pnr;
  };

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

    setErrors(newErrors);

    // Update warnings
    const allWarnings = validateAllFields();
    setWarnings(allWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Normalize personnummer before submission
      let submissionData = { ...formData };

      if (submissionData.Personnummer) {
        submissionData.Personnummer = normalizePersonnummer(
          submissionData.Personnummer
        );
      }

      // Ensure new persons are always set to active
      submissionData = {
        ...submissionData,
        Aktiv: initialData.id ? submissionData.Aktiv : true,
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

    // Clear existing timeout to prevent multiple validations
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Real-time validation for specific fields with debounce
    const newTimeout = setTimeout(() => {
      const allWarnings = validateAllFields();
      setWarnings(allWarnings);
    }, 300);

    setValidationTimeout(newTimeout);
  };

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

  const getFieldWarnings = (fieldName: string) => {
    return warnings.filter((w) => w.field === fieldName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="mr-2 h-6 w-6" />
            {initialData.id ? "Redigera person" : "Lägg till person"}
          </DialogTitle>
          <DialogDescription>
            {initialData.id
              ? "Uppdatera informationen för denna person."
              : "Fyll i informationen för att lägga till en ny person i systemet."}
          </DialogDescription>
        </DialogHeader>

        {/* Warnings Summary */}
        {warnings.length > 0 && (
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
                  <span className="text-xs text-orange-700">
                    {warning.message}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Du kan fortfarande spara, men kontrollera att informationen är
              korrekt för Fortnox-integration.
            </p>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
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
                      onChange={(e) =>
                        handleInputChange("Förnamn", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("Efternamn", e.target.value)
                      }
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
                    onChange={(e) =>
                      handleInputChange("Personnummer", e.target.value)
                    }
                    placeholder="ÅÅÅÅÅMMDD-XXXX"
                  />
                  {getFieldWarnings("Personnummer").map((warning, index) => (
                    <div key={index} className="flex items-center gap-1 mt-1">
                      {warning.severity === "error" ? (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      ) : (
                        <Check className="h-3 w-3 text-orange-500" />
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
                    onChange={(e) =>
                      handleInputChange("E-post", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleInputChange("Adress", e.target.value)
                    }
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
                      onChange={(e) =>
                        handleInputChange("Postnr", e.target.value)
                      }
                      placeholder="12345"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground mb-1">
                      Postort
                    </label>
                    <Input
                      type="text"
                      value={formData.Postort || ""}
                      onChange={(e) =>
                        handleInputChange("Postort", e.target.value)
                      }
                      placeholder="Stockholm"
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
                          onChange={(e) =>
                            handleInputChange("Befattning", e.target.value)
                          }
                          placeholder="Ange egen befattning"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomBefattning(false);
                            setFormData((prev) => ({
                              ...prev,
                              Befattning: "",
                            }));
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
                          <SelectItem value="custom">
                            Annan befattning...
                          </SelectItem>
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
                            handleInputChange("Kostnadsställe", e.target.value)
                          }
                          placeholder="Ange eget kostnadsställe"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomKostnadsställe(false);
                            setFormData((prev) => ({
                              ...prev,
                              Kostnadsställe: "",
                            }));
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

            {/* Financial Information Section */}
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
                      onChange={(e) =>
                        handleInputChange("Clearingnr", e.target.value)
                      }
                      placeholder="1234"
                    />
                    {getFieldWarnings("Clearingnr").map((warning, index) => (
                      <div key={index} className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">
                          {warning.message}
                        </span>
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
                      onChange={(e) =>
                        handleInputChange("Bankkonto", e.target.value)
                      }
                      placeholder="1234567890"
                    />
                    {getFieldWarnings("Bankkonto").map((warning, index) => (
                      <div key={index} className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
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
                      value={formData["Skattesats"] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "Skattesats",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="30.0"
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
                          handleInputChange(
                            "Sociala Avgifter",
                            e.target.checked
                          )
                        }
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
                    onChange={(e) =>
                      handleInputChange("Ändringsdag", e.target.value)
                    }
                  />
                  {getFieldWarnings("Ändringsdag").map((warning, index) => (
                    <div key={index} className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        {warning.message}
                      </span>
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
                      step="0.01"
                      value={formData.Månad || ""}
                      onChange={(e) =>
                        handleInputChange("Månad", e.target.value)
                      }
                      placeholder="25000.00"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground mb-1">
                      Timlön (kr)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.Timme || ""}
                      onChange={(e) =>
                        handleInputChange("Timme", e.target.value)
                      }
                      placeholder="150.00"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground mb-1">
                      Heldagslön (kr)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.Heldag || ""}
                      onChange={(e) =>
                        handleInputChange("Heldag", e.target.value)
                      }
                      placeholder="1200.00"
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
                    onChange={(e) =>
                      handleInputChange("Kommentar", e.target.value)
                    }
                    placeholder="Övriga anteckningar..."
                  />
                </div>
              </div>
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
