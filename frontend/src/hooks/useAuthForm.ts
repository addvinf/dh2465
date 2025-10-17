import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { type LoginCredentials, type RegisterCredentials, authService } from '../services/authService';
import { 
  validateLoginForm, 
  validateRegisterForm, 
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  type AuthValidationError 
} from '../utils/authValidation';
import { useToast } from '../components/ui/use-toast';

export function useAuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<AuthValidationError[]>([]);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { login: authLogin, register: authRegister, registerOnly } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const login = async (credentials: LoginCredentials) => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Validate form
      const validation = validateLoginForm(credentials.email, credentials.password);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Attempt login
      await authLogin(credentials.email, credentials.password);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
  // Redirect to the page the user originally tried to access, if any
  const from = (location.state as any)?.from?.pathname || '/';
  navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Add server error to validation errors for display
      setValidationErrors([{
        field: "general",
        message: errorMessage,
        severity: "error"
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email || validateEmail(email).length > 0) return false;
    
    try {
      setIsCheckingEmail(true);
      const response = await authService.checkEmailExists(email);
      return response.exists;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const register = async (
    credentials: RegisterCredentials & { confirmPassword?: string }, 
    redirectPath: string = '/'
  ) => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Validate form with confirm password if provided
      if (credentials.confirmPassword !== undefined) {
        const validation = validateRegisterForm(
          credentials.email, 
          credentials.password, 
          credentials.confirmPassword
        );
        
        if (!validation.isValid) {
          setValidationErrors(validation.errors);
          return;
        }
      }

      // Attempt registration
      let result;
      if (redirectPath === '/login') {
        result = await registerOnly(credentials.email, credentials.password, credentials.role);
      } else {
        result = await authRegister(credentials.email, credentials.password, credentials.role);
      }
      
      // Handle email verification case
      if (result?.requiresVerification) {
        // Navigate to email verification page with email in state
        navigate('/email-verification', { 
          state: { email: credentials.email } 
        });
        return;
      }
      
      toast({
        title: "Registration Successful",
        description: redirectPath === '/login' 
          ? "Your account has been created! Please log in to continue." 
          : "Your account has been created!",
      });
      
      navigate(redirectPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Add server error to validation errors for display
      setValidationErrors([{
        field: "general",
        message: errorMessage,
        severity: "error"
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateField = (field: string, value: string, extraValue?: string) => {
    // Remove existing errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field));
    
    let newErrors: AuthValidationError[] = [];
    
    switch (field) {
      case 'email':
        newErrors = validateEmail(value);
        break;
      case 'password':
        newErrors = validatePassword(value, true); // Assume register validation
        break;
      case 'confirmPassword':
        newErrors = validatePasswordConfirmation(extraValue || '', value);
        break;
    }
    
    // Add new errors for this field
    setValidationErrors(prev => [...prev, ...newErrors]);
  };

  const clearErrors = () => {
    setValidationErrors([]);
  };

  const getFieldError = (field: string): string | undefined => {
    const error = validationErrors.find(e => e.field === field && e.severity === "error");
    return error?.message;
  };

  const getFieldWarning = (field: string): string | undefined => {
    const warning = validationErrors.find(e => e.field === field && e.severity === "warning");
    return warning?.message;
  };

  const hasErrors = validationErrors.some(error => error.severity === "error");

  return {
    login,
    register,
    checkEmailExists,
    validateField,
    clearErrors,
    getFieldError,
    getFieldWarning,
    isSubmitting,
    isCheckingEmail,
    hasErrors,
    validationErrors,
  };
}