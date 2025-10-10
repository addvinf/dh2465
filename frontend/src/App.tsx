import { Toaster } from "./components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FrontPage from "./pages/FrontPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import { PersonnelSection } from "./pages/PersonnelSection";
import { KompensationPage } from "./pages/CompensationPage";
import { MontlyRetainerPage } from "./pages/MonthlyRetainerPage";
import { SettingsSection } from "./pages/SettingsSection";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";

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
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <FrontPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole={['admin', 'manager']}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/personal" element={
                  <ProtectedRoute>
                    <PersonnelSection />
                  </ProtectedRoute>
                } />
                <Route path="/kompensation" element={
                  <ProtectedRoute>
                    <KompensationPage />
                  </ProtectedRoute>
                } />
                <Route path="/monthly" element={
                  <ProtectedRoute>
                    <MontlyRetainerPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsSection />
                  </ProtectedRoute>
                } />
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
