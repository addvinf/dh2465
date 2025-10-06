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
import { SettingsProvider } from "./contexts/SettingsContext";

const queryClient = new QueryClient();

const App = () => (
  <div className="dark min-h-screen">
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<FrontPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/personal" element={<PersonnelSection />} />
              <Route path="/kompensation" element={<KompensationPage />} />
              <Route path="/monthly" element={<MontlyRetainerPage />} />
              <Route path="/settings" element={<SettingsSection />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </div>
);

export default App;
