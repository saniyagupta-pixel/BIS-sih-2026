import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldAlert,
  Layers,
  Database,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Droplets,
  HardHat,
  Building2,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: string, categoryFilter?: string) => void;
  onOpenIntegrations?: () => void;
}

interface StatsData {
  totalStandards: number;
  totalCertifications: number;
  totalRelationships: number;
  supportedCategoriesCount: number;
  standardsWithAmendments: number;
  averageRecommendationConfidence: number;
  hitAt1Percentage: number;
  hitAt3Percentage: number;
  mrrAt5: number;
  avgLatencyMs: number;
  categories: string[];
}

interface CategoryInfo {
  name: string;
  count: number;
  sampleStandards: string[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Lighting: <Lightbulb className="w-5 h-5 text-amber-600" />,
  'Industrial Safety': <HardHat className="w-5 h-5 text-rose-600" />,
  Electrical: <Zap className="w-5 h-5 text-blue-600" />,
  'Water & Plumbing': <Droplets className="w-5 h-5 text-cyan-600" />,
  'Construction & Materials': <Building2 className="w-5 h-5 text-stone-600" />,
};

const CHART_COLORS = ['#1d4ed8', '#0284c7', '#059669', '#d97706', '#dc2626'];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenIntegrations }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, catRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/categories'),
        ]);
        if (statsRes.ok && catRes.ok) {
          const statsJson = await statsRes.json();
          const catJson = await catRes.json();
          setStats(statsJson);
          setCategories(catJson);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryChartData = categories.map((c) => ({
    name: c.name.length > 15 ? c.name.split('&')[0].trim() : c.name,
    fullName: c.name,
    standards: c.count,
  }));

  const relationshipTypesData = [
    { name: 'Normative Ref', count: 6, color: '#1d4ed8' },
    { name: 'Safety Std', count: 7, color: '#dc2626' },
    { name: 'Test Method', count: 3, color: '#059669' },
    { name: 'Material Std', count: 4, color: '#d97706' },
    { name: 'Installation', count: 3, color: '#7c3aed' },
  ];

  return (
    <div className="space-y-8">
      {/* Official Government Welcome Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Bureau of Indian Standards (BIS) Recommendation System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome to the AI Procurement Standards Assistant
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Identify applicable Indian Standards, statutory Quality Control Orders (QCO), normative references, and conformity assessment schemes from unstructured procurement specifications and tender text.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-sm text-slate-700 font-medium italic border-l-2 border-blue-600 pl-3">
              <span>"Smarter standards. Better specifications. More reliable procurement."</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              id="btn-quick-analyze"
              onClick={() => onNavigate('tender')}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Analyze Tender Specification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="btn-quick-graph"
              onClick={() => onNavigate('graph')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium border border-slate-300 transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Explore Knowledge Graph</span>
            </button>
          </div>
        </div>

        {/* Prototype & Verification Warning Callout */}
        <div className="mt-6 p-4 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Prototype Knowledge Base Notice (Curated Indian Standards Subset):
            </p>
            <p className="text-amber-800 leading-relaxed">
              This prototype contains a curated, interconnected database of verified Indian Standards and regulatory schemes across five key procurement domains. All recommendations are AI-assisted decision aids and must be formally verified against the latest Bureau of Indian Standards gazette publications before tender floatation.
            </p>
          </div>
        </div>

        {/* Enterprise Architecture Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Enterprise Stack:</span>
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
              📄 PDF Ingestion (<code className="font-mono text-[10px]">pdf-parse</code>)
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
              🍃 MongoDB (<code className="font-mono text-[10px]">mongodb</code> persistence)
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
              🌲 Pinecone Vector DB (<code className="font-mono text-[10px]">@pinecone</code> RAG)
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
              ✨ Grounded AI (<code className="font-mono text-[10px]">Gemini 2.5</code>)
            </span>
          </div>
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="text-xs text-blue-700 hover:text-blue-800 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>View Architecture & Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Standards</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? '...' : stats?.totalStandards}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Verified BIS Codes</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Certifications</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-blue-700">
            {loading ? '...' : stats?.totalCertifications}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">ISI, CRS, QCO Schemes</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Relationships</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? '...' : stats?.totalRelationships}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Normative & Safety Edges</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Supported Domains</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? '...' : stats?.supportedCategoriesCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Key Public Works Sectors</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Amendments Tracked</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">
            {loading ? '...' : stats?.standardsWithAmendments}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Version History Logged</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Retrieval Hit@1</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-blue-700">
            {loading ? '...' : `${stats?.hitAt1Percentage}%`}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">Benchmark Precision</div>
        </div>
      </div>

      {/* Supported Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Supported Procurement Domains</h3>
            <p className="text-xs text-slate-500">Curated Indian Standards clusters with verified normative and testing relationships</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>View Full BIS Catalog</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigate('catalog', cat.name)}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded bg-slate-100">{CATEGORY_ICONS[cat.name] || <Database className="w-5 h-5 text-slate-600" />}</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {cat.count} Standards
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{cat.name}</h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Key specifications:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cat.sampleStandards.map((std) => (
                      <span key={std} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {std.split('(')[0].trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-700">
                <span>Browse cluster</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics & Knowledge Graph Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Standards by Category */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Standards Distribution by Category</h4>
              <p className="text-xs text-slate-500">Indexed standard specifications in prototype knowledge base</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Standards`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="standards" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Relationship Topology */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Knowledge Graph Relationships</h4>
              <p className="text-xs text-slate-500">Inter-standard dependency and test method linkages</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={relationshipTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {relationshipTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Connections`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('tender')}
          className="p-5 rounded-lg bg-blue-900 text-white cursor-pointer hover:bg-blue-950 transition-colors shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Primary Tool</span>
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <h4 className="font-bold text-base text-white">Tender Generator</h4>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Paste tender requirements or choose from realistic preloaded samples to identify applicable standards and QCOs.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-amber-400">
            <span>Launch Generator</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('graph')}
          className="p-5 rounded-lg bg-slate-800 text-white cursor-pointer hover:bg-slate-850 transition-colors shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Graph Engine</span>
              <Layers className="w-5 h-5 text-slate-300" />
            </div>
            <h4 className="font-bold text-base text-white">Standards Knowledge Graph</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Explore interconnected clusters linking primary specifications to mandatory test methods, materials, and safety codes.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-blue-400">
            <span>Inspect Graph</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('evaluation')}
          className="p-5 rounded-lg bg-emerald-900 text-white cursor-pointer hover:bg-emerald-950 transition-colors shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Anti-Hallucination Guard</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <h4 className="font-bold text-base text-white">RAG Benchmarks & Evaluation</h4>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
              Inspect test queries, Hit@1 and MRR@5 retrieval metrics, and multi-layer hallucination prevention verification.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-amber-300">
            <span>View Benchmark Report</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
