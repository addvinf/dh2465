import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Save, X } from "lucide-react";
import type { Account } from "../../../types/settings";

export const ACCOUNT_TYPES = [
  { value: "tillgång", label: "Tillgång" },
  { value: "skuld", label: "Skuld" },
  { value: "eget_kapital", label: "Eget kapital" },
  { value: "intäkt", label: "Intäkt" },
  { value: "kostnad", label: "Kostnad" },
] as const;

interface AccountFormProps {
  account?: Account;
  onSave: (account: Account) => void;
  onAdd?: (account: Omit<Account, "id">) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

interface FormErrors {
  accountNumber?: string;
  accountName?: string;
  type?: string;
}

export function AccountForm({
  account,
  onSave,
  onAdd,
  onCancel,
  mode,
}: AccountFormProps) {
  const [formData, setFormData] = useState({
    accountNumber: account?.accountNumber || "",
    accountName: account?.accountName || "",
    type: account?.type || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Account number validation
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Kontonummer är obligatoriskt";
    } else if (!/^\d{4}$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = "Kontonummer måste vara 4 siffror";
    }

    // Account name validation
    if (!formData.accountName.trim()) {
      newErrors.accountName = "Kontonamn är obligatoriskt";
    } else if (formData.accountName.trim().length < 2) {
      newErrors.accountName = "Kontonamn måste vara minst 2 tecken";
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = "Kontotyp måste väljas";
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
      const accountData = {
        accountNumber: formData.accountNumber.trim(),
        accountName: formData.accountName.trim(),
        type: formData.type,
      };

      if (mode === "edit" && account) {
        onSave({ ...account, ...accountData });
      } else if (mode === "create" && onAdd) {
        onAdd(accountData);
      }
    } catch (error) {
      console.error("Error saving account:", error);
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
      formData.accountNumber.trim() !== "" &&
      formData.accountName.trim() !== "" &&
      formData.type !== "" &&
      /^\d{4}$/.test(formData.accountNumber.trim()) &&
      formData.accountName.trim().length >= 2
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="account-number">
          Kontonummer <span className="text-red-500">*</span>
        </Label>
        <Input
          id="account-number"
          value={formData.accountNumber}
          onChange={(e) => handleFieldChange("accountNumber", e.target.value)}
          placeholder="t.ex. 1920"
          maxLength={4}
          aria-invalid={!!errors.accountNumber}
          aria-describedby={
            errors.accountNumber ? "account-number-error" : undefined
          }
        />
        {errors.accountNumber && (
          <p id="account-number-error" className="text-sm text-red-500 mt-1">
            {errors.accountNumber}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="account-name">
          Kontonamn <span className="text-red-500">*</span>
        </Label>
        <Input
          id="account-name"
          value={formData.accountName}
          onChange={(e) => handleFieldChange("accountName", e.target.value)}
          placeholder="t.ex. Bankkonto"
          aria-invalid={!!errors.accountName}
          aria-describedby={
            errors.accountName ? "account-name-error" : undefined
          }
        />
        {errors.accountName && (
          <p id="account-name-error" className="text-sm text-red-500 mt-1">
            {errors.accountName}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="account-type">
          Kontotyp <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleFieldChange("type", value)}
        >
          <SelectTrigger id="account-type" aria-invalid={!!errors.type}>
            <SelectValue placeholder="Välj kontotyp" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500 mt-1">{errors.type}</p>
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
