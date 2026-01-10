import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
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

import { PublicConsultingPage } from "./pages/PublicConsultingPage";
import { ClientAuthPage } from "./pages/ClientAuthPage";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import { ClientDiagnosticForm } from "./pages/ClientDiagnosticForm";
import AdminUsersPage from "./pages/AdminUsersPage";
import { AdminClientViewPage } from "./pages/AdminClientViewPage";
import { ConsultingPage } from "./pages/ConsultingPage";
import { AuthPage } from "./pages/AuthPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import NotFound from "./pages/NotFound";
import { HomePage } from "./pages/HomePage";
import { BlogPage } from "./pages/BlogPage";
import { BlogArticlePage } from "./pages/BlogArticlePage";
import { BioLinkPage } from "./pages/BioLinkPage";
import { EbookCapturePage } from "./pages/EbookCapturePage";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Página pública inicial - rafaelegg.com */}
      <Route path="/" element={<HomePage />} />
      <Route path="/bio" element={<BioLinkPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogArticlePage />} />
      <Route path="/ebook" element={<EbookCapturePage />} />
      
      {/* Autenticação admin */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/privacidade" element={<PrivacyPolicyPage />} />
      
      {/* Páginas públicas */}
      <Route path="/agendar/:userId" element={<PublicBookingPage />} />
      
      {/* Consultoria - Página pública com informações sobre a consultoria */}
      <Route path="/consultoria" element={<PublicConsultingPage />} />
      
      {/* Área do Cliente da Consultoria - Login e Dashboard */}
      <Route path="/consultoria/login" element={<ClientAuthPage />} />
      <Route path="/consultoria/dashboard" element={<ClientDashboardPage />} />
      <Route path="/consultoria/diagnostico" element={<ClientDiagnosticForm />} />
      <Route path="/cadastro-cliente/:consultantId" element={<ClientAuthPage />} />
      
      {/* Método IDEA - CRM Admin - /metodo-idea (requer login do admin) */}
      <Route
        path="/metodo-idea/*"
        element={
          <AdminRoute>
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
                <Route path="/consultoria/cliente/:clientId" element={<AdminClientViewPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="/admin/usuarios" element={<AdminUsersPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </AdminRoute>
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