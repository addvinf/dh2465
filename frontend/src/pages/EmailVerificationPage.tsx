import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { Mail, CheckCircle } from 'lucide-react';

export const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const { resendVerification, isResending, cooldownSeconds, isButtonDisabled } = useEmailVerification();
  
  // Get email from location state (passed from registration)
  const email = location.state?.email || '';

  const handleResendVerification = async () => {
    if (email) {
      try {
        await resendVerification(email);
      } catch (error) {
        // Error is already handled in the hook, this is just to prevent unhandled promise rejection
        console.error('Error in handleResendVerification:', error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to your email address
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {email && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Email sent to:
              </p>
              <p className="text-sm font-medium text-foreground break-all">
                {email}
              </p>
            </div>
          )}
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Check your inbox</p>
                <p className="text-muted-foreground">
                  Click the verification link in the email we sent you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Check spam folder</p>
                <p className="text-muted-foreground">
                  The email might be in your spam or junk folder
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResendVerification}
              disabled={isButtonDisabled || !email}
              variant="outline"
              className="w-full"
            >
              {isResending 
                ? "Sending..." 
                : cooldownSeconds > 0 
                  ? `Resend Available in ${cooldownSeconds}s`
                  : "Resend Verification Email"
              }
            </Button>
            
            <div className="text-center text-sm">
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPage;