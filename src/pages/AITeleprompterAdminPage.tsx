import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { AppStoreStatsCards } from "@/components/appstore/AppStoreStatsCards";
import { DownloadsChart } from "@/components/appstore/DownloadsChart";
import { RevenueChart } from "@/components/appstore/RevenueChart";
import { CountryDistributionChart } from "@/components/appstore/CountryDistributionChart";
import { ReviewsList } from "@/components/appstore/ReviewsList";
import { RatingsDistribution } from "@/components/appstore/RatingsDistribution";
import { SalesTable } from "@/components/appstore/SalesTable";
import { SyncStatusCard } from "@/components/appstore/SyncStatusCard";
import { useAppStoreSales } from "@/hooks/useAppStoreSales";
import { useAppStoreReviews } from "@/hooks/useAppStoreReviews";
import { useAppStoreMetrics } from "@/hooks/useAppStoreMetrics";
import { useAppStoreSync } from "@/hooks/useAppStoreSync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoAiTeleprompter from "@/assets/logo-ai-teleprompter.png";

function AITeleprompterAdminContent() {
  const { sales, isLoading: salesLoading } = useAppStoreSales();
  const { reviews, isLoading: reviewsLoading } = useAppStoreReviews();
  const { metrics, isLoading: metricsLoading } = useAppStoreMetrics();
  const { syncAll, isSyncing, lastSync } = useAppStoreSync();
  const [activeTab, setActiveTab] = useState("overview");

  const isLoading = salesLoading || reviewsLoading || metricsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/metodo-idea">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao CRM
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <img 
                  src={logoAiTeleprompter} 
                  alt="AI Teleprompter" 
                  className="h-10 w-10 rounded-lg"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">AI Teleprompter</h1>
                  <p className="text-xs text-white/60">App Store Admin Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a 
                href="https://appstoreconnect.apple.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  App Store Connect
                </Button>
              </a>
              <Button 
                onClick={syncAll} 
                disabled={isSyncing}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70">
              Vendas
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70">
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <AppStoreStatsCards 
              sales={sales} 
              reviews={reviews} 
              metrics={metrics}
              isLoading={isLoading}
            />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DownloadsChart metrics={metrics} isLoading={metricsLoading} />
              <RevenueChart sales={sales} isLoading={salesLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CountryDistributionChart sales={sales} isLoading={salesLoading} />
              <RatingsDistribution reviews={reviews} isLoading={reviewsLoading} />
              <SyncStatusCard lastSync={lastSync} />
            </div>

            {/* Recent Reviews */}
            <ReviewsList reviews={reviews?.slice(0, 5) || []} isLoading={reviewsLoading} showAll={false} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart sales={sales} isLoading={salesLoading} />
              <CountryDistributionChart sales={sales} isLoading={salesLoading} />
            </div>
            <SalesTable sales={sales || []} isLoading={salesLoading} />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ReviewsList reviews={reviews || []} isLoading={reviewsLoading} showAll />
              </div>
              <RatingsDistribution reviews={reviews} isLoading={reviewsLoading} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DownloadsChart metrics={metrics} isLoading={metricsLoading} />
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Métricas de Engajamento</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Sessões (últimos 30 dias)</span>
                    <span className="text-white font-semibold">
                      {metrics?.reduce((acc, m) => acc + (m.sessions || 0), 0).toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Dispositivos Ativos</span>
                    <span className="text-white font-semibold">
                      {metrics?.[0]?.active_devices?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Crashes</span>
                    <span className="text-red-400 font-semibold">
                      {metrics?.reduce((acc, m) => acc + (m.crashes || 0), 0) || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Impressões na App Store</span>
                    <span className="text-white font-semibold">
                      {metrics?.reduce((acc, m) => acc + (m.impressions || 0), 0).toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">Visualizações da Página</span>
                    <span className="text-white font-semibold">
                      {metrics?.reduce((acc, m) => acc + (m.page_views || 0), 0).toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export function AITeleprompterAdminPage() {
  return (
    <AdminRoute>
      <AITeleprompterAdminContent />
    </AdminRoute>
  );
}
