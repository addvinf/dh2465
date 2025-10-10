export interface AuthValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface LoginValidation {
  isValid: boolean;
  errors: AuthValidationError[];
}

export interface RegisterValidation {
  isValid: boolean;
  errors: AuthValidationError[];
}

export function validateEmail(email: string): AuthValidationError[] {
  const errors: AuthValidationError[] = [];
  
  if (!email) {
    errors.push({
      field: "email",
      message: "Email is required",
      severity: "error",
    });
    return errors;
  }

  if (!email.trim()) {
    errors.push({
      field: "email",
      message: "Email cannot be empty",
      severity: "error",
    });
    return errors;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address",
      severity: "error",
    });
  }

  return errors;
}

export function validatePassword(password: string, isRegister: boolean = false): AuthValidationError[] {
  const errors: AuthValidationError[] = [];
  
  if (!password) {
    errors.push({
      field: "password",
      message: "Password is required",
      severity: "error",
    });
    return errors;
  }

  // For registration, use the new Google standards
  if (isRegister) {
    if (password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters long",
        severity: "error",
      });
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one lowercase letter",
        severity: "error",
      });
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one uppercase letter",
        severity: "error",
      });
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one number",
        severity: "error",
      });
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one special character",
        severity: "error",
      });
    }
    
    // Check for common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 
      'password123', '12345678', '1234567890', 'letmein',
      'welcome', 'monkey', 'dragon', 'master', 'admin'
    ];
    
    if (commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    )) {
      errors.push({
        field: "password",
        message: "Password cannot contain common password patterns",
        severity: "error",
      });
    }
  }

  return errors;
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): AuthValidationError[] {
  const errors: AuthValidationError[] = [];
  
  if (!confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Please confirm your password",
      severity: "error",
    });
    return errors;
  }

  if (password !== confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
      severity: "error",
    });
  }

  return errors;
}

export function validateLoginForm(email: string, password: string): LoginValidation {
  const errors: AuthValidationError[] = [];
  
  errors.push(...validateEmail(email));
  errors.push(...validatePassword(password, false));
  
  return {
    isValid: errors.filter(e => e.severity === "error").length === 0,
    errors,
  };
}

export function validateRegisterForm(
  email: string, 
  password: string, 
  confirmPassword: string
): RegisterValidation {
  const errors: AuthValidationError[] = [];
  
  errors.push(...validateEmail(email));
  errors.push(...validatePassword(password, true));
  errors.push(...validatePasswordConfirmation(password, confirmPassword));
  
  return {
    isValid: errors.filter(e => e.severity === "error").length === 0,
    errors,
  };
}

export function getFieldError(errors: AuthValidationError[], field: string): string | undefined {
  const error = errors.find(e => e.field === field && e.severity === "error");
  return error?.message;
}

export function getFieldWarning(errors: AuthValidationError[], field: string): string | undefined {
  const warning = errors.find(e => e.field === field && e.severity === "warning");
  return warning?.message;
}