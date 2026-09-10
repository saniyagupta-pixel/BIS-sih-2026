import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Award,
  ChevronRight,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Standard, Certification } from '../../types';

interface BISCatalogViewProps {
  initialCategory?: string;
  onSelectStandardForTender?: (standardId: string) => void;
}

export const BISCatalogView: React.FC<BISCatalogViewProps> = ({
  initialCategory,
  onSelectStandardForTender,
}) => {
  const [activeTab, setActiveTab] = useState<'standards' | 'certifications'>('standards');
  const [standards, setStandards] = useState<Standard[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeStandard, setActiveStandard] = useState<Standard | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [stdRes, certRes] = await Promise.all([
          fetch('/api/standards'),
          fetch('/api/certifications'),
        ]);
        if (stdRes.ok && certRes.ok) {
          const stdData: Standard[] = await stdRes.json();
          const certData: Certification[] = await certRes.json();
          setStandards(stdData);
          setCertifications(certData);
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filtered Standards
  const filteredStandards = useMemo(() => {
    return standards.filter((s) => {
      const matchCat = selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchStatus = selectedStatus === 'All' || s.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.standardNumber.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.scope.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q));

      return matchCat && matchStatus && matchQuery;
    });
  }, [standards, selectedCategory, selectedStatus, searchQuery]);

  // Filtered Certifications
  const filteredCertifications = useMemo(() => {
    return certifications.filter((c) => {
      const matchCat =
        selectedCategory === 'All' ||
        c.applicableCategories.some((ac) => ac.toLowerCase().includes(selectedCategory.toLowerCase()));
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.authority.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);

      return matchCat && matchQuery;
    });
  }, [certifications, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-800 mb-1">
          <Database className="w-4 h-4 text-blue-700" />
          <span>Curated Specifications & Conformity Directory</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">BIS Standards & Certification Catalog</h2>
        <p className="text-sm text-slate-600 mt-1">
          Prototype knowledge base containing a limited, verified subset of 21 Indian Standards and 6 statutory conformity assessment schemes.
        </p>

        {/* Tabs */}
        <div className="flex space-x-2 mt-4 border-b border-slate-200">
          <button
            id="tab-standards"
            onClick={() => setActiveTab('standards')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'standards'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Indian Standards ({standards.length})
          </button>
          <button
            id="tab-certifications"
            onClick={() => setActiveTab('certifications')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'certifications'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conformity & Certification Schemes ({certifications.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'standards'
                ? 'Search standard code (e.g. IS 10322), keyword, or title...'
                : 'Search certification scheme or authority...'
            }
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-600">Domain Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="All">All Domains</option>
            <option value="Lighting">Lighting</option>
            <option value="Industrial Safety">Industrial Safety</option>
            <option value="Electrical">Electrical</option>
            <option value="Water & Plumbing">Water & Plumbing</option>
            <option value="Construction & Materials">Construction & Materials</option>
          </select>
        </div>

        {activeTab === 'standards' && (
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Current">Current</option>
              <option value="Amended">Amended</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Standards Catalog Table */}
      {activeTab === 'standards' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Standard Number</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Year</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStandards.map((std) => (
                  <tr
                    key={std.standardId}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => setActiveStandard(std)}
                  >
                    <td className="p-3.5 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {std.standardNumber}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 max-w-md">
                      <div>{std.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{std.scope}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {std.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{std.year}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[11px]">
                        {std.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStandard(std);
                        }}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs flex justify-between items-center">
            <span>Showing {filteredStandards.length} of {standards.length} verified standards</span>
            <span className="italic">Data provenance: Official Bureau of Indian Standards (BIS) Catalog</span>
          </div>
        </div>
      )}

      {/* Tab 2: Certifications Catalog */}
      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCertifications.map((cert) => (
            <div
              key={cert.certificationId}
              className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {cert.authority}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{cert.name}</h3>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded whitespace-nowrap ${
                      cert.applicabilityStatus === 'Potentially Applicable'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-blue-100 text-blue-900 border border-blue-300'
                    }`}
                  >
                    {cert.applicabilityStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{cert.description}</p>

                <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-900">Key Compliance Requirements:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    {cert.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Applicable Products:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {cert.applicableProducts.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Source: {cert.source.sourceName}</span>
                {cert.source.sourceUrl && (
                  <a
                    href={cert.source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline flex items-center space-x-1"
                  >
                    <span>Scheme Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Standard Details Modal */}
      {activeStandard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <div>
                <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  {activeStandard.standardNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{activeStandard.title}</h3>
              </div>
              <button
                onClick={() => setActiveStandard(null)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium">
                  Year: {activeStandard.year}
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-medium">
                  Status: {activeStandard.status}
                </span>
                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                  Category: {activeStandard.category}
                </span>
                {activeStandard.supersedes && (
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-medium">
                    Supersedes: {activeStandard.supersedes}
                  </span>
                )}
              </div>

              <div>
                <strong className="text-slate-900 block mb-1">Standard Scope:</strong>
                <p className="leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {activeStandard.scope}
                </p>
              </div>

              <div>
                <strong className="text-slate-900 block mb-1">Technical Requirements & Testing Parameters:</strong>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-600">
                  {activeStandard.technicalRequirements.map((tr, i) => (
                    <li key={i}>{tr}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="text-slate-900 block mb-1">Applications & Product Domains:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {activeStandard.applications.map((app, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-xs border border-blue-200">
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {activeStandard.amendments.length > 0 && (
                <div>
                  <strong className="text-slate-900 block mb-1">Published Amendments:</strong>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
                    {activeStandard.amendments.map((am, i) => (
                      <li key={i}>{am}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
                <div>Source: {activeStandard.source.sourceName}</div>
                <div>Last Verified: {activeStandard.source.lastVerified}</div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end rounded-b-lg">
              <button
                onClick={() => setActiveStandard(null)}
                className="px-4 py-2 rounded bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
