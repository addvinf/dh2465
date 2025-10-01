import { useState, useEffect } from "react";
import {
  validatePersonnummer,
  validateClearingnr,
  validateBankkonto,
  validateDate,
  validateEmail,
  normalizePersonnummer,
  type ValidationWarning,
} from "../utils/personnelValidation";
import { REQUIRED_FIELDS } from "../constants/personnelForm";
import type { PersonnelRecord, PersonnelFormProps } from "../types/personnel";

export function usePersonnelForm({
  isOpen,
  initialData = {},
  onSubmit,
}: Pick<PersonnelFormProps, "isOpen" | "initialData" | "onSubmit">) {
  const [formData, setFormData] = useState<Partial<PersonnelRecord>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [validationTimeout, setValidationTimeout] = useState<number | null>(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
      setWarnings([]);
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const validateAllFields = (skipWhileTyping: boolean = true): ValidationWarning[] => {
    let allWarnings: ValidationWarning[] = [];

    if (formData.Personnummer) {
      allWarnings.push(...validatePersonnummer(formData.Personnummer, skipWhileTyping));
    }

    if (formData.Clearingnr) {
      allWarnings.push(...validateClearingnr(formData.Clearingnr));
    }

    if (formData.Bankkonto) {
      allWarnings.push(...validateBankkonto(formData.Bankkonto));
    }

    if (formData.Ändringsdag) {
      allWarnings.push(...validateDate(formData.Ändringsdag, "Ändringsdag"));
    }

    return allWarnings;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    REQUIRED_FIELDS.forEach((field) => {
      if (!formData[field as keyof PersonnelRecord]) {
        newErrors[field] = "Detta fält är obligatoriskt";
      }
    });

    // Email validation
    if (formData["E-post"] && !validateEmail(formData["E-post"])) {
      newErrors["E-post"] = "Ogiltig e-postadress";
    }

    setErrors(newErrors);

    // Update warnings
    const allWarnings = validateAllFields(false); // Don't skip validation on form submit
    setWarnings(allWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    key: keyof PersonnelRecord,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear error for the specific field when user starts typing
    if (errors[String(key)]) {
      setErrors((prev) => {
        const { [String(key)]: _, ...rest } = prev;
        return rest;
      });
    }

    // Clear any existing validation timeout since we're not doing real-time validation
    if (validationTimeout) {
      clearTimeout(validationTimeout);
      setValidationTimeout(null);
    }

    // No real-time validation - only validate on blur or submit
  };

  const handleFieldBlur = (_key: keyof PersonnelRecord) => {
    // Clear any pending validation timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
      setValidationTimeout(null);
    }

    // Delay validation slightly to allow tab navigation to complete first
    const newTimeout = setTimeout(() => {
      const allWarnings = validateAllFields(false); // Don't skip validation on blur  
      setWarnings(allWarnings);
    }, 50); // Short delay to allow focus transition

    setValidationTimeout(newTimeout);
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

  const getFieldWarnings = (fieldName: string) => {
    return warnings.filter((w) => w.field === fieldName);
  };

  return {
    formData,
    setFormData,
    errors,
    warnings,
    handleInputChange,
    handleFieldBlur,
    handleSubmit,
    getFieldWarnings,
    validateForm,
  };
}