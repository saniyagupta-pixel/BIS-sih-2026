import React from 'react';
import { ShieldCheck, FileCheck, Layers, Database, BarChart3, Info, AlertTriangle, Server } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenIntegrations?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenIntegrations }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tender', label: 'Tender Generator', icon: FileCheck },
    { id: 'graph', label: 'Knowledge Graph', icon: Layers },
    { id: 'catalog', label: 'BIS Catalog', icon: Database },
    { id: 'evaluation', label: 'Evaluation & Benchmarks', icon: ShieldCheck },
    { id: 'about', label: 'About & Methodology', icon: Info },
  ];

  return (
    <header className="bg-slate-900 text-white border-b-4 border-amber-500 shadow-md">
      {/* Top Ministry Banner */}
      <div className="bg-slate-950 px-4 py-1 text-xs text-slate-400 border-b border-slate-800 flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300">Government Procurement Standards Decision Support Portal</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Smart India Hackathon Working Prototype</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Source Verification Required
          </span>
          <span className="text-slate-500">Prototype Knowledge Base</span>
        </div>
      </div>

      {/* Main Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="p-2.5 bg-blue-700 rounded-lg shadow-inner border border-blue-500">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AI Procurement Standards Assistant
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase rounded bg-blue-800 text-blue-200 border border-blue-600">
                BIS Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-2xl">
              AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications
            </p>
          </div>
        </div>

        {/* Status Badges & Tech Stack Modal Trigger */}
        <div className="flex items-center space-x-2 text-right">
          <button
            onClick={onOpenIntegrations}
            title="Click to inspect PDF Reader, MongoDB, Pinecone and Gemini AI status"
            className="flex items-center space-x-2 px-3 py-1.5 rounded bg-blue-900/60 hover:bg-blue-800 border border-blue-500/80 text-blue-200 text-xs font-medium transition-all shadow-xs"
          >
            <Server className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">Tech Stack & Integrations</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>
          <div className="hidden lg:flex items-center space-x-2">
            <div className="bg-slate-800/90 px-3 py-1.5 rounded border border-slate-700 text-left">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hallucination Guard</div>
              <div className="text-xs font-medium text-emerald-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                Strict Whitelist Enforced
              </div>
            </div>
            <div className="bg-slate-800/90 px-3 py-1.5 rounded border border-slate-700 text-left">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Retrieval Mode</div>
              <div className="text-xs font-medium text-blue-300">Hybrid RAG + Graph</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-slate-800/95 border-t border-slate-700 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
