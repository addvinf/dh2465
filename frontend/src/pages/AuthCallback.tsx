import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the tokens from URL parameters (either query params or hash)
        let accessToken = searchParams.get('access_token');
        let refreshToken = searchParams.get('refresh_token');
        let expiresAt = searchParams.get('expires_at');
        let type = searchParams.get('type');

        // If not in query params, check hash parameters (for direct Supabase redirects)
        if (!accessToken && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          expiresAt = hashParams.get('expires_at');
          type = hashParams.get('type');
        }

        if (!accessToken || !refreshToken) {
          setStatus('error');
          setMessage('Missing authentication tokens');
          return;
        }

        // Store the session data
        const sessionData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt ? parseInt(expiresAt) : undefined
        };

        // Store in localStorage
        localStorage.setItem('authSession', JSON.stringify(sessionData));

        // Get user profile with the access token
        const response = await fetch('http://localhost:3000/auth/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await response.json(); // Verify the token is valid
          setStatus('success');
          
          if (type === 'signup') {
            setMessage('Email confirmed successfully! Welcome to the platform.');
          } else {
            setMessage('Login successful!');
          }

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          throw new Error('Failed to fetch user profile');
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try logging in again.');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Processing authentication...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your email.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <h2 className="text-xl font-semibold mb-2 text-green-600">Success!</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-500 text-4xl mb-4">✗</div>
              <h2 className="text-xl font-semibold mb-2 text-red-600">Authentication Error</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you to login...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;