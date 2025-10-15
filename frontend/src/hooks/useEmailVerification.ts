import { useState, useEffect, useRef } from 'react';
import { emailVerificationService } from '../services/emailVerificationService';

export const useEmailVerification = () => {
  const [isResending, setIsResending] = useState(false);
  // Initialize with 60-second countdown to match Supabase's rate limiting
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const timerRef = useRef<number | null>(null);

  // Countdown effect for cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cooldownSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const resendVerification = async (email: string) => {
    // If in cooldown, just return without doing anything
    if (cooldownSeconds > 0) {
      return;
    }

    setIsResending(true);
    
    try {
      await emailVerificationService.resendVerification(email);
      
      // Start exactly 60-second cooldown to match Supabase's rate limit
      setCooldownSeconds(60);
    } catch (error) {
      // Handle Supabase rate limit errors
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Extract wait time from Supabase error message
      const waitTimeMatch = errorMessage.match(/after (\d+) seconds/);
      if (waitTimeMatch) {
        const waitTime = parseInt(waitTimeMatch[1]);
        setCooldownSeconds(waitTime);
        console.log(`Supabase rate limit: waiting ${waitTime} seconds`);
      } else {
        // Default to 60 seconds if we can't parse the error
        setCooldownSeconds(60);
        console.error('Failed to resend verification email:', error);
      }
    } finally {
      setIsResending(false);
    }
  };

  const isButtonDisabled = isResending || cooldownSeconds > 0;

  return {
    resendVerification,
    isResending,
    cooldownSeconds,
    isButtonDisabled,
  };
};