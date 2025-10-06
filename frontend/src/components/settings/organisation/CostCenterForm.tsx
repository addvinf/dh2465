import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/Button";
import { Save, X } from "lucide-react";
import type { CostCenter } from "../../../types/settings";

interface CostCenterFormProps {
  costCenter?: CostCenter;
  onSave: (costCenter: CostCenter) => void;
  onAdd?: (costCenter: Omit<CostCenter, "id">) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

interface FormErrors {
  code?: string;
  name?: string;
  description?: string;
}

export function CostCenterForm({
  costCenter,
  onSave,
  onAdd,
  onCancel,
  mode,
}: CostCenterFormProps) {
  const [formData, setFormData] = useState({
    code: costCenter?.code || "",
    name: costCenter?.name || "",
    description: costCenter?.description || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = "Kod är obligatorisk";
    } else if (!/^[A-Za-z0-9]{1,10}$/.test(formData.code.trim())) {
      newErrors.code =
        "Kod får bara innehålla bokstäver och siffror (max 10 tecken)";
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Namn är obligatoriskt";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Namn måste vara minst 2 tecken";
    }

    // Description is optional but if provided, should be reasonable length
    if (formData.description && formData.description.length > 200) {
      newErrors.description = "Beskrivning får vara max 200 tecken";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const costCenterData = {
        code: formData.code.trim().toUpperCase(), // Normalize code to uppercase
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (mode === "edit" && costCenter) {
        onSave({ ...costCenter, ...costCenterData });
      } else if (mode === "create" && onAdd) {
        onAdd(costCenterData);
      }
    } catch (error) {
      console.error("Error saving cost center:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return (
      formData.code.trim() !== "" &&
      formData.name.trim() !== "" &&
      /^[A-Za-z0-9]{1,10}$/.test(formData.code.trim()) &&
      formData.name.trim().length >= 2
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cost-center-code">
          Kod <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cost-center-code"
          value={formData.code}
          onChange={(e) => handleFieldChange("code", e.target.value)}
          placeholder="t.ex. 100"
          maxLength={10}
          aria-invalid={!!errors.code}
          aria-describedby={errors.code ? "cost-center-code-error" : undefined}
        />
        {errors.code && (
          <p id="cost-center-code-error" className="text-sm text-red-500 mt-1">
            {errors.code}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="cost-center-name">
          Namn <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cost-center-name"
          value={formData.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="t.ex. Administration"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "cost-center-name-error" : undefined}
        />
        {errors.name && (
          <p id="cost-center-name-error" className="text-sm text-red-500 mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="cost-center-description">Beskrivning</Label>
        <Input
          id="cost-center-description"
          value={formData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Beskrivning av kostnadsställe"
          maxLength={200}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "cost-center-description-error" : undefined
          }
        />
        {errors.description && (
          <p
            id="cost-center-description-error"
            className="text-sm text-red-500 mt-1"
          >
            {errors.description}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-3 w-3 mr-1" />
          Avbryt
        </Button>
        <Button type="submit" disabled={!isFormValid() || isSubmitting}>
          <Save className="h-3 w-3 mr-1" />
          {mode === "create" ? "Lägg till" : "Spara"}
        </Button>
      </div>
    </form>
  );
}
