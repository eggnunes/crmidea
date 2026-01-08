import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { LeadsPage } from "./pages/LeadsPage";
import { ClientsPage } from "./pages/ClientsPage";
import { PipelinePage } from "./pages/PipelinePage";
import { ProductsPage } from "./pages/ProductsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { IntegrationsDashboardPage } from "./pages/IntegrationsDashboardPage";
import { WhatsAppPage } from "./pages/WhatsAppPage";
import { AlertsCenterPage } from "./pages/AlertsCenterPage";
import { CalendarPage } from "./pages/CalendarPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import { PublicDiagnosticForm } from "./pages/PublicDiagnosticForm";
import { PublicConsultingPage } from "./pages/PublicConsultingPage";
import { ClientAuthPage } from "./pages/ClientAuthPage";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import { ClientDiagnosticForm } from "./pages/ClientDiagnosticForm";
import AdminUsersPage from "./pages/AdminUsersPage";
import { ConsultingPage } from "./pages/ConsultingPage";
import { AuthPage } from "./pages/AuthPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import NotFound from "./pages/NotFound";
import { HomePage } from "./pages/HomePage";
import { BlogPage } from "./pages/BlogPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Página pública inicial - rafaelegg.com */}
      <Route path="/" element={<HomePage />} />
      <Route path="/blog" element={<BlogPage />} />
      
      {/* Autenticação */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/privacidade" element={<PrivacyPolicyPage />} />
      
      {/* Páginas públicas */}
      <Route path="/agendar/:userId" element={<PublicBookingPage />} />
      <Route path="/diagnostico/:consultantId" element={<PublicDiagnosticForm />} />
      <Route path="/sobre-consultoria" element={<PublicConsultingPage />} />
      
      {/* Área do cliente da consultoria - /consultoria */}
      <Route path="/consultoria" element={<ClientAuthPage />} />
      <Route path="/consultoria/dashboard" element={<ClientDashboardPage />} />
      <Route path="/consultoria/diagnostico" element={<ClientDiagnosticForm />} />
      <Route path="/cadastro-cliente/:consultantId" element={<ClientAuthPage />} />
      
      {/* Método IDEIA - CRM Admin - /metodo-ideia */}
      <Route
        path="/metodo-ideia/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/integracoes" element={<IntegrationsDashboardPage />} />
                <Route path="/whatsapp" element={<WhatsAppPage />} />
                <Route path="/alertas" element={<AlertsCenterPage />} />
                <Route path="/calendario" element={<CalendarPage />} />
                <Route path="/consultoria" element={<ConsultingPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="/admin/usuarios" element={<AdminUsersPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Rota de fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
