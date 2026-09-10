import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { TenderGeneratorView } from './components/tender/TenderGeneratorView';
import { KnowledgeGraphView } from './components/graph/KnowledgeGraphView';
import { BISCatalogView } from './components/catalog/BISCatalogView';
import { EvaluationView } from './components/evaluation/EvaluationView';
import { AboutView } from './components/about/AboutView';
import { IntegrationsStatusModal } from './components/common/IntegrationsStatusModal';
import { RecommendationResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');
  const [tenderSampleId, setTenderSampleId] = useState<string | undefined>(undefined);
  const [activeRecommendation, setActiveRecommendation] = useState<RecommendationResponse | null>(null);
  const [graphInitialMode, setGraphInitialMode] = useState<'catalog' | 'tender'>('catalog');
  const [showIntegrationsModal, setShowIntegrationsModal] = useState<boolean>(false);

  const handleNavigate = (
    tab: string,
    categoryFilter?: string,
    rec?: RecommendationResponse,
    graphMode?: 'catalog' | 'tender'
  ) => {
    if (categoryFilter) {
      setCatalogCategoryFilter(categoryFilter);
    }
    if (rec) {
      setActiveRecommendation(rec);
    }
    if (graphMode) {
      setGraphInitialMode(graphMode);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIntegrations={() => setShowIntegrationsModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab, cat) => handleNavigate(tab, cat)}
            onOpenIntegrations={() => setShowIntegrationsModal(true)}
          />
        )}
        {activeTab === 'tender' && (
          <TenderGeneratorView
            initialSampleId={tenderSampleId}
            activeRecommendation={activeRecommendation}
            onActiveRecommendationChange={setActiveRecommendation}
            onNavigateToCatalog={(stdId) => handleNavigate('catalog')}
            onNavigateToGraph={(stdId, rec) => handleNavigate('graph', undefined, rec, 'tender')}
            onOpenIntegrations={() => setShowIntegrationsModal(true)}
          />
        )}
        {activeTab === 'graph' && (
          <KnowledgeGraphView
            activeRecommendation={activeRecommendation}
            onActiveRecommendationChange={setActiveRecommendation}
            initialMode={graphInitialMode}
            onNavigateToTender={() => handleNavigate('tender')}
            onSelectStandardForTender={(stdId) => handleNavigate('tender')}
          />
        )}
        {activeTab === 'catalog' && (
          <BISCatalogView initialCategory={catalogCategoryFilter} />
        )}
        {activeTab === 'evaluation' && <EvaluationView />}
        {activeTab === 'about' && (
          <AboutView onOpenIntegrations={() => setShowIntegrationsModal(true)} />
        )}
      </main>

      <IntegrationsStatusModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
      />

      <Footer />
    </div>
  );
}

