import { useState, useCallback } from 'react';
import { validatePasswordStrength } from '../utils/passwordValidation';

export interface UsePasswordFormProps {
  onSubmit: (password: string, confirmPassword?: string) => Promise<void>;
  requireConfirmation?: boolean;
}

export interface UsePasswordFormReturn {
  password: string;
  confirmPassword: string;
  passwordErrors: string[];
  confirmErrors: string[];
  isLoading: boolean;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setIsLoading: (loading: boolean) => void;
}

export function usePasswordForm({ 
  onSubmit, 
  requireConfirmation = true 
}: UsePasswordFormProps): UsePasswordFormReturn {
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPasswordValue] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmErrors, setConfirmErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setPassword = useCallback((value: string) => {
    setPasswordValue(value);
    
    // Validate password strength in real-time
    const errors = validatePasswordStrength(value);
    setPasswordErrors(errors.map(err => err.message));
    
    // If confirmation is required and confirm password exists, re-validate match
    if (requireConfirmation && confirmPassword) {
      if (value !== confirmPassword) {
        setConfirmErrors(['Passwords do not match']);
      } else {
        setConfirmErrors([]);
      }
    }
  }, [confirmPassword, requireConfirmation]);

  const setConfirmPassword = useCallback((value: string) => {
    setConfirmPasswordValue(value);
    
    // Validate password match in real-time
    if (requireConfirmation) {
      if (password !== value) {
        setConfirmErrors(['Passwords do not match']);
      } else {
        setConfirmErrors([]);
      }
    }
  }, [password, requireConfirmation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submit
    const strengthErrors = validatePasswordStrength(password);
    const hasStrengthErrors = strengthErrors.length > 0;
    
    let hasConfirmErrors = false;
    if (requireConfirmation && password !== confirmPassword) {
      hasConfirmErrors = true;
      setConfirmErrors(['Passwords do not match']);
    }
    
    if (hasStrengthErrors || hasConfirmErrors) {
      return; // Don't submit if there are errors
    }
    
    setIsLoading(true);
    try {
      await onSubmit(password, requireConfirmation ? confirmPassword : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, requireConfirmation, onSubmit]);

  return {
    password,
    confirmPassword,
    passwordErrors,
    confirmErrors,
    isLoading,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    setIsLoading
  };
}