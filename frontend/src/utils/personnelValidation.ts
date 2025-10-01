export interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning" | "error";
}

export function validatePersonnummer(pnr: string, skipWhileTyping: boolean = false): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Don't validate at all if field is empty
  if (!pnr) {
    return warnings;
  }
  
  const cleaned = pnr.replace(/[-\s]/g, "");

  // If we're in "typing mode", be much more lenient
  if (skipWhileTyping) {
    // Only validate if the user has entered what looks like a complete personnummer
    if (cleaned.length >= 10) {
      // Check if it's only digits for complete numbers
      if (!/^\d+$/.test(cleaned)) {
        warnings.push({
          field: "Personnummer",
          message: "Personnummer ska endast innehålla siffror och bindestreck",
          severity: "error",
        });
        return warnings;
      }

      if (cleaned.length === 10) {
        warnings.push({
          field: "Personnummer",
          message: "10-siffrigt personnummer kommer att konverteras till 12-siffrigt format",
          severity: "warning",
        });
      } else if (cleaned.length > 12) {
        warnings.push({
          field: "Personnummer",
          message: "Personnummer ska vara 10 eller 12 siffror (YYYYMMDD-XXXX)",
          severity: "error",
        });
      }
    }
    // For incomplete numbers while typing, show no warnings at all
    return warnings;
  }

  // Full validation when not typing (on blur or form submit)
  // Check if it's only digits
  if (!/^\d+$/.test(cleaned)) {
    warnings.push({
      field: "Personnummer",
      message: "Personnummer ska endast innehålla siffror och bindestreck",
      severity: "error",
    });
    return warnings;
  }

  if (cleaned.length === 10) {
    warnings.push({
      field: "Personnummer",
      message: "10-siffrigt personnummer kommer att konverteras till 12-siffrigt format",
      severity: "warning",
    });
  } else if (cleaned.length === 12) {
    // Valid 12-digit format - no warnings needed
  } else if (cleaned.length < 10) {
    warnings.push({
      field: "Personnummer",
      message: "Personnummer är för kort (minst 10 siffror krävs)",
      severity: "error",
    });
  } else {
    warnings.push({
      field: "Personnummer",
      message: "Personnummer ska vara 10 eller 12 siffror (YYYYMMDD-XXXX)",
      severity: "error",
    });
  }

  return warnings;
}

export function validateClearingnr(clearingnr: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const cleaned = clearingnr.replace(/[-\s]/g, "");

  if (cleaned.length < 4 || cleaned.length > 5 || !/^\d+$/.test(cleaned)) {
    warnings.push({
      field: "Clearingnr",
      message: "Clearingnummer ska vara 4-5 siffror",
      severity: "warning",
    });
  }

  return warnings;
}

export function validateBankkonto(bankkonto: string): ValidationWarning[] {
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
}

export function validateDate(date: string, fieldName: string): ValidationWarning[] {
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
}

export function normalizePersonnummer(pnr: string): string {
  const cleaned = pnr.replace(/[-\s]/g, "");

  if (cleaned.length === 10) {
    // Convert 10-digit to 12-digit by adding century
    const year = parseInt(cleaned.substring(0, 2));
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const cutoff = currentYear - currentCentury + 10; // 10 years in the future

    const century = year <= cutoff ? currentCentury : currentCentury - 100;
    return `${century + year}${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }

  // Format 12-digit number
  if (cleaned.length === 12) {
    return `${cleaned.substring(0, 8)}-${cleaned.substring(8)}`;
  }

  return pnr;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}