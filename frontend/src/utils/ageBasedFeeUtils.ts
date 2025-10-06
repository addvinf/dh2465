import type { AgeBasedFee } from '../types/settings';

/**
 * Get the appropriate employer fee rate based on age
 * @param age - The person's age
 * @param ageBasedFees - Array of age-based fee rules
 * @returns The fee rate as a percentage, or null if no rule matches
 */
export function getEmployerFeeRateForAge(
  age: number,
  ageBasedFees: AgeBasedFee[]
): number | null {
  // Find the matching fee rule for the given age
  const matchingFee = ageBasedFees.find((fee) => {
    const withinLowerBound = age >= fee.lowerBound;
    const withinUpperBound = fee.upperBound === null || age <= fee.upperBound;
    return withinLowerBound && withinUpperBound;
  });

  return matchingFee ? matchingFee.feeRate : null;
}

/**
 * Calculate age from Swedish personal number (personnummer)
 * @param personnummer - Swedish personal number in format YYYYMMDD-XXXX or YYMMDD-XXXX
 * @returns Age in years, or null if invalid format
 */
export function calculateAgeFromPersonnummer(personnummer: string): number | null {
  if (!personnummer) return null;

  // Remove any non-numeric characters except dash
  const cleaned = personnummer.replace(/[^\d-]/g, '');
  
  // Handle different formats: YYYYMMDD-XXXX or YYMMDD-XXXX
  let dateStr = cleaned.split('-')[0];
  
  if (dateStr.length === 6) {
    // Convert YYMMDD to YYYYMMDD
    const year = parseInt(dateStr.substring(0, 2));
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    
    // Determine century - if year > current year's last 2 digits, it's previous century
    const fullYear = year > (currentYear % 100) ? 
      currentCentury - 100 + year : 
      currentCentury + year;
    
    dateStr = fullYear.toString() + dateStr.substring(2);
  } else if (dateStr.length !== 8) {
    return null; // Invalid format
  }

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));

  // Validate date components
  if (year < 1900 || year > new Date().getFullYear() + 1 ||
      month < 1 || month > 12 ||
      day < 1 || day > 31) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Get employer fee rate directly from a Swedish personal number
 * @param personnummer - Swedish personal number
 * @param ageBasedFees - Array of age-based fee rules
 * @returns The fee rate as a percentage, or null if cannot determine
 */
export function getEmployerFeeRateFromPersonnummer(
  personnummer: string,
  ageBasedFees: AgeBasedFee[]
): number | null {
  const age = calculateAgeFromPersonnummer(personnummer);
  if (age === null) return null;
  
  return getEmployerFeeRateForAge(age, ageBasedFees);
}

/**
 * Validate age-based fee rules for overlaps and gaps
 * @param ageBasedFees - Array of age-based fee rules to validate
 * @returns Object with validation results
 */
export function validateAgeBasedFees(ageBasedFees: AgeBasedFee[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Sort fees by lower bound for easier validation
  const sortedFees = [...ageBasedFees].sort((a, b) => a.lowerBound - b.lowerBound);

  // Check for overlaps and gaps
  for (let i = 0; i < sortedFees.length - 1; i++) {
    const current = sortedFees[i];
    const next = sortedFees[i + 1];

    // Check for overlap
    if (current.upperBound !== null && current.upperBound >= next.lowerBound) {
      errors.push(
        `Överlappning mellan regel "${current.description}" (${current.lowerBound}-${current.upperBound}) och "${next.description}" (${next.lowerBound}-${next.upperBound || '∞'})`
      );
    }

    // Check for gap
    if (current.upperBound !== null && current.upperBound + 1 < next.lowerBound) {
      warnings.push(
        `Lucka mellan regel "${current.description}" (slutar vid ${current.upperBound}) och "${next.description}" (börjar vid ${next.lowerBound})`
      );
    }
  }

  // Check for invalid bounds
  sortedFees.forEach((fee, index) => {
    if (fee.lowerBound < 0) {
      errors.push(`Regel ${index + 1}: Lägsta ålder kan inte vara negativ`);
    }
    
    if (fee.upperBound !== null) {
      if (fee.upperBound <= fee.lowerBound) {
        errors.push(`Regel ${index + 1}: Högsta ålder måste vara större än lägsta ålder`);
      }
      if (fee.upperBound > 120) {
        warnings.push(`Regel ${index + 1}: Högsta ålder ${fee.upperBound} verkar ovanligt hög`);
      }
    }

    if (fee.feeRate < 0 || fee.feeRate > 100) {
      errors.push(`Regel ${index + 1}: Avgiftssats måste vara mellan 0 och 100%`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}