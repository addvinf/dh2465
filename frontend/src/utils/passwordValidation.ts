export interface PasswordValidationError {
  message: string;
  severity: 'error' | 'warning';
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: PasswordValidationError[];
}

/**
 * Validates password according to Google's security standards
 * - At least 8 characters
 * - One uppercase letter
 * - One lowercase letter  
 * - One number
 * - One special character
 * - No common password patterns
 */
export function validatePasswordStrength(password: string): PasswordValidationError[] {
  const errors: PasswordValidationError[] = [];
  
  if (!password) {
    errors.push({
      message: 'Password is required',
      severity: 'error'
    });
    return errors;
  }

  if (password.length < 8) {
    errors.push({
      message: 'Password must be at least 8 characters long',
      severity: 'error'
    });
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push({
      message: 'Password must contain at least one lowercase letter',
      severity: 'error'
    });
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push({
      message: 'Password must contain at least one uppercase letter',
      severity: 'error'
    });
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push({
      message: 'Password must contain at least one number',
      severity: 'error'
    });
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/.test(password)) {
    errors.push({
      message: 'Password must contain at least one special character',
      severity: 'error'
    });
  }
  
  // Check for common passwords (Google blocks these)
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', '12345678', '1234567890', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'admin'
  ];
  
  if (commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  )) {
    errors.push({
      message: 'Password cannot contain common password patterns',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Validates that passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): PasswordValidationError[] {
  const errors: PasswordValidationError[] = [];
  
  if (password !== confirmPassword) {
    errors.push({
      message: 'Passwords do not match',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Comprehensive password validation for forms
 */
export function validatePassword(
  password: string, 
  confirmPassword?: string
): PasswordValidationResult {
  let allErrors: PasswordValidationError[] = [];
  
  // Validate password strength
  const strengthErrors = validatePasswordStrength(password);
  allErrors = [...allErrors, ...strengthErrors];
  
  // Validate password match if confirmPassword is provided
  if (confirmPassword !== undefined) {
    const matchErrors = validatePasswordMatch(password, confirmPassword);
    allErrors = [...allErrors, ...matchErrors];
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}