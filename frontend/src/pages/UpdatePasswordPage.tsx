import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { PasswordInput } from '../components/PasswordInput';
import { usePasswordForm } from '../hooks/usePasswordForm';
import { extractSupabaseTokens, validateTokens } from '../utils/supabaseTokens';

const UpdatePasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePasswordSubmit = async (password: string) => {
    try {
      await authService.updatePassword(password, accessToken!, refreshToken || '');
      setSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password updated successfully. Please log in with your new password.' }
        });
      }, 3000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Network error. Please try again.');
    }
  };

  const {
    password,
    confirmPassword,
    passwordErrors,
    confirmErrors,
    isLoading,
    setPassword,
    setConfirmPassword,
    handleSubmit
  } = usePasswordForm({
    onSubmit: async (password: string) => {
      try {
        await handlePasswordSubmit(password);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update password');
        throw err; // Re-throw to let the hook handle loading state
      }
    },
    requireConfirmation: true
  });

  useEffect(() => {
    const tokens = extractSupabaseTokens(searchParams);
    const validation = validateTokens(tokens);
    
    if (validation.isValid) {
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
    } else {
      setError(validation.error || 'Invalid reset link');
    }
  }, [searchParams]);

  if (error && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/reset-password">Request New Reset Link</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password Updated</CardTitle>
            <CardDescription>
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <AlertDescription>
                Redirecting you to login page in 3 seconds...
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link to="/login">Continue to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Update Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <PasswordInput
              id="password"
              label="New Password"
              placeholder="Enter your new password"
              value={password}
              onChange={setPassword}
              errors={passwordErrors}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              errors={confirmErrors}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;