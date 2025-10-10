import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateRegisterForm } from '../utils/authValidation';
import { PasswordInput } from '../components/PasswordInput';
import { usePasswordForm } from '../hooks/usePasswordForm';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin'); // Default to admin as per previous requirement
  const { register, isSubmitting, getFieldError } = useAuthForm();

  const handlePasswordSubmit = async (password: string, confirmPassword?: string) => {
    if (!confirmPassword) {
      throw new Error('Confirm password is required');
    }

    // Validate form before submitting
    const validation = validateRegisterForm(email, password, confirmPassword);
    if (!validation.isValid) {
      throw new Error('Form validation failed');
    }

    await register({ email, password, confirmPassword, role }, '/login');
  };

  const {
    password,
    confirmPassword,
    passwordErrors,
    confirmErrors,
    isLoading,
    setPassword,
    setConfirmPassword,
    handleSubmit: handlePasswordFormSubmit
  } = usePasswordForm({
    onSubmit: handlePasswordSubmit,
    requireConfirmation: true
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Sign up to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                autoComplete="email"
                className={getFieldError('email') ? 'border-destructive' : ''}
              />
              {getFieldError('email') && (
                <p className="text-sm text-destructive">{getFieldError('email')}</p>
              )}
            </div>
            <PasswordInput
              id="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              errors={passwordErrors}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              errors={confirmErrors}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {getFieldError('general') && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {getFieldError('general')}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting}
            >
              {(isLoading || isSubmitting) ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;