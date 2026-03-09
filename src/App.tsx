import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Homepage loaded eagerly (LCP route)
import { HomePage } from "./pages/HomePage";

// All other routes lazy-loaded to reduce initial bundle
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage").then(m => ({ default: m.ClientsPage })));
const PipelinePage = lazy(() => import("./pages/PipelinePage").then(m => ({ default: m.PipelinePage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then(m => ({ default: m.ProductsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const IntegrationsDashboardPage = lazy(() => import("./pages/IntegrationsDashboardPage").then(m => ({ default: m.IntegrationsDashboardPage })));
const WhatsAppPage = lazy(() => import("./pages/WhatsAppPage").then(m => ({ default: m.WhatsAppPage })));
const AlertsCenterPage = lazy(() => import("./pages/AlertsCenterPage").then(m => ({ default: m.AlertsCenterPage })));
const CalendarPage = lazy(() => import("./pages/CalendarPage").then(m => ({ default: m.CalendarPage })));
const PublicBookingPage = lazy(() => import("./pages/PublicBookingPage").then(m => ({ default: m.PublicBookingPage })));
const PublicConsultingPage = lazy(() => import("./pages/PublicConsultingPage").then(m => ({ default: m.PublicConsultingPage })));
const ConsultingEconomyPage = lazy(() => import("./pages/ConsultingEconomyPage").then(m => ({ default: m.ConsultingEconomyPage })));
const ClientAuthPage = lazy(() => import("./pages/ClientAuthPage").then(m => ({ default: m.ClientAuthPage })));
const ClientDashboardPage = lazy(() => import("./pages/ClientDashboardPage").then(m => ({ default: m.ClientDashboardPage })));
const ClientDiagnosticForm = lazy(() => import("./pages/ClientDiagnosticForm").then(m => ({ default: m.ClientDiagnosticForm })));
const ClientResetPasswordPage = lazy(() => import("./pages/ClientResetPasswordPage").then(m => ({ default: m.ClientResetPasswordPage })));
const EditFeaturePrioritiesPage = lazy(() => import("./pages/EditFeaturePrioritiesPage").then(m => ({ default: m.EditFeaturePrioritiesPage })));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminClientViewPage = lazy(() => import("./pages/AdminClientViewPage").then(m => ({ default: m.AdminClientViewPage })));
const ConsultingPage = lazy(() => import("./pages/ConsultingPage").then(m => ({ default: m.ConsultingPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then(m => ({ default: m.AuthPage })));
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage").then(m => ({ default: m.CompleteProfilePage })));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BlogPage = lazy(() => import("./pages/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogArticlePage = lazy(() => import("./pages/BlogArticlePage").then(m => ({ default: m.BlogArticlePage })));
const BioLinkPage = lazy(() => import("./pages/BioLinkPage").then(m => ({ default: m.BioLinkPage })));
const EbookCapturePage = lazy(() => import("./pages/EbookCapturePage").then(m => ({ default: m.EbookCapturePage })));
const FAQPage = lazy(() => import("./pages/FAQPage").then(m => ({ default: m.FAQPage })));
const AITeleprompterAdminPage = lazy(() => import("./pages/AITeleprompterAdminPage").then(m => ({ default: m.AITeleprompterAdminPage })));
const EmailCenterPage = lazy(() => import("./pages/EmailCenterPage").then(m => ({ default: m.EmailCenterPage })));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.DashboardPage })));

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Routes>
        {/* Página pública inicial - rafaelegg.com */}
        <Route path="/" element={<HomePage />} />
        <Route path="/bio" element={<BioLinkPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogArticlePage />} />
        <Route path="/ebook" element={<EbookCapturePage />} />
        <Route path="/faq" element={<FAQPage />} />
        
        {/* Autenticação admin */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/completar-perfil" element={<CompleteProfilePage />} />
        <Route path="/privacidade" element={<PrivacyPolicyPage />} />

        
        {/* AI Teleprompter Admin */}
        <Route path="/aiteleprompteradmin" element={<AITeleprompterAdminPage />} />
        
        {/* Páginas públicas */}
        <Route path="/agendar/:userId" element={<PublicBookingPage />} />
        
        {/* Consultoria - Página pública com informações sobre a consultoria */}
        <Route path="/consultoria" element={<PublicConsultingPage />} />
        <Route path="/consultoria/economia" element={<ConsultingEconomyPage />} />
        
        {/* Área do Cliente da Consultoria - Login e Dashboard */}
        <Route path="/consultoria/login" element={<ClientAuthPage />} />
        <Route path="/consultoria/redefinir-senha" element={<ClientResetPasswordPage />} />
        <Route path="/consultoria/dashboard" element={<ClientDashboardPage />} />
        <Route path="/consultoria/diagnostico" element={<ClientDiagnosticForm />} />
        <Route path="/consultoria/editar-prioridades" element={<EditFeaturePrioritiesPage />} />
        <Route path="/cadastro-cliente/:consultantId" element={<ClientAuthPage />} />
        
        {/* Método IDEA - CRM Admin - /metodo-idea (requer login do admin) */}
        <Route
          path="/metodo-idea/*"
          element={
            <AdminRoute>
              <AppLayout>
                <Suspense fallback={<div className="min-h-screen" />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/clientes" element={<ClientsPage />} />
                    <Route path="/pipeline" element={<PipelinePage />} />
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/integracoes" element={<IntegrationsDashboardPage />} />
                    <Route path="/whatsapp" element={<WhatsAppPage />} />
                    <Route path="/alertas" element={<AlertsCenterPage />} />
                    <Route path="/emails" element={<EmailCenterPage />} />
                    <Route path="/campanhas" element={<CampaignsPage />} />
                    <Route path="/calendario" element={<CalendarPage />} />
                    <Route path="/consultoria" element={<ConsultingPage />} />
                    <Route path="/consultoria/cliente/:clientId" element={<AdminClientViewPage />} />
                    <Route path="/configuracoes" element={<SettingsPage />} />
                    <Route path="/admin/usuarios" element={<AdminUsersPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </AdminRoute>
          }
        />
        
        {/* Rota de fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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