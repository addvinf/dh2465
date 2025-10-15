import { Toaster } from "./components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import FrontPage from "./pages/FrontPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import { PersonnelSection } from "./pages/PersonnelSection";
import { LonerPage } from "./pages/CompensationPage"; // keep this name consistent with usage below
import { MontlyRetainerPage } from "./pages/MonthlyRetainerPage";
import { SettingsSection } from "./pages/SettingsSection";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import AuthCallback from "./pages/AuthCallback";

import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <div className="dark min-h-screen">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Public routes (auth) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/email-verification" element={<EmailVerificationPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes */}
                {/* Front page - admin only access */}
                <Route path="/" element={
                  <ProtectedRoute adminOnly={true}>
                    <FrontPage />
                  </ProtectedRoute>
                } />
                {/* Admin-only routes */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/personal" element={
                  <ProtectedRoute adminOnly={true}>
                    <PersonnelSection />
                  </ProtectedRoute>
                } />
                <Route path="/kompensation" element={
                  <ProtectedRoute adminOnly={true}>
                    <LonerPage />
                  </ProtectedRoute>
                } />
                <Route path="/monthly" element={
                  <ProtectedRoute adminOnly={true}>
                    <MontlyRetainerPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute adminOnly={true}>
                    <SettingsSection />
                  </ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </div>
);

export default App;