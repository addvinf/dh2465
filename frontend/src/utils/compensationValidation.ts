import type { CompensationRecord } from "../types/compensation";
import type { PersonnelRecord } from "../types/personnel";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a compensation record with comprehensive field validation
 */
export function validateCompensationRecord(
  record: Partial<CompensationRecord>,
  personnelList: PersonnelRecord[] = []
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required field validation
  if (!record.Ledare?.trim()) {
    errors.push({
      field: "Ledare",
      message: "Ledare är obligatorisk",
      severity: "error"
    });
  } else {
    // Check if person exists in personnel list
    const personExists = personnelList.some(p => 
      `${p.Förnamn} ${p.Efternamn}`.toLowerCase() === record.Ledare?.toLowerCase()
    );
    if (!personExists && personnelList.length > 0) {
      warnings.push({
        field: "Ledare",
        message: "Person finns inte i personallistan",
        severity: "warning"
      });
    }
  }

  if (!record["Avser Mån/år"]?.trim()) {
    errors.push({
      field: "Avser Mån/år",
      message: "Period är obligatorisk",
      severity: "error"
    });
  } else {
    // Validate period format (YYYY-MM)
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(record["Avser Mån/år"])) {
      errors.push({
        field: "Avser Mån/år",
        message: "Period måste vara i format YYYY-MM",
        severity: "error"
      });
    }
  }

  if (!record.Kostnadsställe?.trim()) {
    errors.push({
      field: "Kostnadsställe",
      message: "Kostnadsställe är obligatorisk",
      severity: "error"
    });
  }

  if (!record.Aktivitetstyp?.trim()) {
    errors.push({
      field: "Aktivitetstyp",
      message: "Aktivitetstyp är obligatorisk",
      severity: "error"
    });
  }

  // Numeric field validation
  const antal = Number(record.Antal);
  if (isNaN(antal) || antal <= 0) {
    errors.push({
      field: "Antal",
      message: "Antal måste vara ett positivt tal",
      severity: "error"
    });
  }

  const ersattning = Number(record.Ersättning);
  if (isNaN(ersattning) || ersattning < 0) {
    errors.push({
      field: "Ersättning",
      message: "Ersättning måste vara 0 eller större",
      severity: "error"
    });
  }

  // Date validation
  if (record["Datum utbet"]?.trim()) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(record["Datum utbet"])) {
      errors.push({
        field: "Datum utbet",
        message: "Datum måste vara i format YYYY-MM-DD",
        severity: "error"
      });
    } else {
      const date = new Date(record["Datum utbet"]);
      if (isNaN(date.getTime())) {
        errors.push({
          field: "Datum utbet",
          message: "Ogiltigt datum",
          severity: "error"
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a single field value
 */
export function validateField(
  fieldName: string,
  value: any,
  personnelList: PersonnelRecord[] = []
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate specific field
  switch (fieldName) {
    case "Ledare":
      if (!value?.trim()) {
        errors.push({
          field: "Ledare",
          message: "Ledare är obligatorisk",
          severity: "error"
        });
      } else {
        // Check if person exists in personnel list
        const personExists = personnelList.some(p => 
          `${p.Förnamn} ${p.Efternamn}`.toLowerCase() === value?.toLowerCase()
        );
        if (!personExists && personnelList.length > 0) {
          warnings.push({
            field: "Ledare",
            message: "Person finns inte i personallistan",
            severity: "warning"
          });
        }
      }
      break;

    case "Avser Mån/år":
      if (!value?.trim()) {
        errors.push({
          field: "Avser Mån/år",
          message: "Period är obligatorisk",
          severity: "error"
        });
      } else {
        // Validate period format (YYYY-MM)
        const periodRegex = /^\d{4}-\d{2}$/;
        if (!periodRegex.test(value)) {
          errors.push({
            field: "Avser Mån/år",
            message: "Period måste vara i format YYYY-MM",
            severity: "error"
          });
        }
      }
      break;

    case "Kostnadsställe":
      if (!value?.trim()) {
        errors.push({
          field: "Kostnadsställe",
          message: "Kostnadsställe är obligatorisk",
          severity: "error"
        });
      } else {
        // Note: Could add cost center validation here if needed
        // For now, just accept any non-empty value
      }
      break;

    case "Aktivitetstyp":
      if (!value?.trim()) {
        errors.push({
          field: "Aktivitetstyp",
          message: "Aktivitetstyp är obligatorisk",
          severity: "error"
        });
      } else {
        // Note: Could add activity type validation here if needed
        // For now, just accept any non-empty value
      }
      break;

    case "Antal":
      const antal = Number(value);
      if (isNaN(antal) || antal <= 0) {
        errors.push({
          field: "Antal",
          message: "Antal måste vara ett positivt tal",
          severity: "error"
        });
      }
      break;

    case "Ersättning":
      const ersattning = Number(value);
      if (isNaN(ersattning) || ersattning < 0) {
        errors.push({
          field: "Ersättning",
          message: "Ersättning måste vara 0 eller större",
          severity: "error"
        });
      }
      break;

    case "Datum utbet":
      if (value?.trim()) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          errors.push({
            field: "Datum utbet",
            message: "Datum måste vara i format YYYY-MM-DD",
            severity: "error"
          });
        } else {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errors.push({
              field: "Datum utbet",
              message: "Ogiltigt datum",
              severity: "error"
            });
          }
        }
      }
      break;

    // Optional fields don't need validation
    case "Upplagd av":
    case "Eventuell kommentar":
      // No validation needed for optional text fields
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Normalizes compensation data from Excel
 */
export function normalizeCompensationRecord(data: any): Partial<CompensationRecord> {
  return {
    "Upplagd av": String(data["Upplagd av"] || "").trim(),
    "Avser Mån/år": String(data["Avser Mån/år"] || "").trim(),
    "Ledare": String(data["Ledare"] || "").trim(),
    "Kostnadsställe": String(data["Kostnadsställe"] || "").trim(),
    "Aktivitetstyp": String(data["Aktivitetstyp"] || "").trim(),
    "Antal": Number(data["Antal"]) || 0,
    "Ersättning": Number(data["Ersättning"]) || 0,
    "Datum utbet": String(data["Datum utbet"] || "").trim(),
    "Eventuell kommentar": String(data["Eventuell kommentar"] || "").trim(),
  };
}

/**
 * Gets the field type for input handling
 */
export function getFieldType(fieldName: string): "text" | "number" | "date" {
  switch (fieldName) {
    case "Antal":
    case "Ersättning":
      return "number";
    case "Datum utbet":
      return "date";
    default:
      return "text";
  }
}

/**
 * Gets CSS classes for validation state (dark mode compatible)
 */
export function getValidationClasses(
  validation: ValidationResult,
  hasValue: boolean = true
): string {
  if (!hasValue) {
    return "border-zinc-600 bg-zinc-800 text-zinc-300";
  }

  if (validation.errors.length > 0) {
    return "border-red-500 bg-red-950/50 text-red-200 ring-red-500/30";
  }

  if (validation.warnings.length > 0) {
    return "border-amber-500 bg-amber-950/50 text-amber-200 ring-amber-500/30";
  }

  return "border-green-500 bg-green-950/50 text-green-200 ring-green-500/30";
}

/**
 * Expected Excel column headers for compensation import
 */
export const EXPECTED_HEADERS = [
  "Upplagd av",
  "Avser Mån/år", 
  "Ledare",
  "Kostnadsställe",
  "Aktivitetstyp",
  "Antal",
  "Ersättning",
  "Datum utbet",
  "Eventuell kommentar"
];

/**
 * Required fields that must have values
 */
export const REQUIRED_FIELDS = [
  "Ledare",
  "Avser Mån/år",
  "Kostnadsställe",
  "Aktivitetstyp",
  "Antal",
  "Ersättning"
];