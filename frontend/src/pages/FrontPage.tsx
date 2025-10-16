import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Header } from "../components/Header";
import { checkFortnoxAuthStatus, initiateFortnoxLogin } from "../services/fortnoxService";
import { useToast } from "../components/ui/use-toast";
const FrontPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [isFortnoxAuthorized, setIsFortnoxAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check for auth callback parameters
    const authStatus = searchParams.get('auth');
    const errorMessage = searchParams.get('message');

    if (authStatus === 'success') {
      toast({
        title: "Authentication Successful!",
        description: "You have successfully authenticated with Fortnox.",
      });
      // Clean up URL parameters
      setSearchParams({});
      // Recheck auth status
      checkAuthStatus();
    } else if (authStatus === 'error') {
      toast({
        title: "Authentication Failed",
        description: errorMessage || "An error occurred during authentication.",
        variant: "destructive",
      });
      // Clean up URL parameters
      setSearchParams({});
    } else {
      // Normal page load
      checkAuthStatus();
    }
  }, [searchParams]);

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const status = await checkFortnoxAuthStatus();
      setIsFortnoxAuthorized(status.authorized);
    } catch (error) {
      console.error("Error checking Fortnox auth status:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleFortnoxAuth = () => {
    try {
      toast({
        title: "Redirecting to Fortnox",
        description: "Please complete the authentication process...",
      });
      initiateFortnoxLogin();
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to initiate Fortnox authentication",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-9xl font-bold m-20">FRONT PAGE</h1>

        <div className="relative w-full max-w-7xl mx-8 my-10">
          <img
            src="/src/assets/joshua-slate-HN9O6R5wUUc-unsplash.jpg"
            alt="Demo background"
            className="rounded-2xl w-full object-cover h-[30rem] brightness-90"
          />
          <div className="absolute top-1/2 left-1/2 frosted-box flex items-center justify-center">
            <div className="p-8 flex flex-col items-center max-w-md">
              <h2 className="text-4xl font-bold text-white mb-4">Demo Page</h2>
              <p className="text-sm  text-white text-center">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                euismod
              </p>
            </div>
          </div>
        </div>

        {/* Fortnox Authentication Section */}
        <div className="mb-8 flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold">Fortnox Integration</h2>
          {isCheckingAuth ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Checking authentication status...</p>
            </div>
          ) : isFortnoxAuthorized ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-semibold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Fortnox Authenticated</span>
              </div>
              <Button
                variant="outline"
                className="px-6 py-2 mt-2"
                onClick={checkAuthStatus}
              >
                Refresh Status
              </Button>
            </div>
          ) : (
            <Button
              className="px-10 py-4 text-lg"
              onClick={handleFortnoxAuth}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Authenticate Fortnox
            </Button>
          )}
        </div>

        <p className="text-xl mb-4">Demo pages:</p>
        <Button
          className="px-10 py-4 text-lg"
          onClick={() => navigate("/admin")}
        >
          Admin Page
        </Button>
        <Button
          className="px-10 py-4 text-lg mt-4"
          onClick={() => navigate("/404")}
        >
          404 Page
        </Button>

        {/* Add a color scheme viewer, showing bg, fg, primary, secondary, etc. */}
        <div className="m-10 p-6 bg-card border border-border rounded-lg shadow-md w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">Color Scheme</h2>
          <div className="grid grid-cols-8 gap-4">
            {[
              "background",
              "foreground",
              "muted",
              "muted-foreground",
              "popover",
              "popover-foreground",
              "card",
              "card-foreground",
              "primary",
              "primary-foreground",
              "secondary",
              "secondary-foreground",
              "secondary-muted",
              "accent",
              "accent-foreground",
              "border",
              "input",
              "ring",
            ].map((color) => (
              <div key={color} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded mb-2 border border-border"
                  style={{ background: `hsl(var(--${color}))` }}
                ></div>
                <span className="text-sm text-center">{color}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FrontPage;
