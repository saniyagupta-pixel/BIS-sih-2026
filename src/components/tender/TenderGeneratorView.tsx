import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  Check,
  X,
  Sliders,
  Award,
  ChevronDown,
  Info,
  UploadCloud,
  FileUp,
  Server,
  Database,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  SampleTender,
  RecommendationResponse,
  PrimaryRecommendation,
  RelatedStandardRecommendation,
} from '../../types';
import { TenderSummaryModal } from './TenderSummaryModal';

interface TenderGeneratorViewProps {
  initialSampleId?: string;
  activeRecommendation?: RecommendationResponse | null;
  onActiveRecommendationChange?: (rec: RecommendationResponse | null) => void;
  onNavigateToCatalog?: (standardId?: string) => void;
  onNavigateToGraph?: (standardId?: string, rec?: RecommendationResponse) => void;
  onOpenIntegrations?: () => void;
}

export const TenderGeneratorView: React.FC<TenderGeneratorViewProps> = ({
  initialSampleId,
  activeRecommendation,
  onActiveRecommendationChange,
  onNavigateToCatalog,
  onNavigateToGraph,
  onOpenIntegrations,
}) => {
  const [samples, setSamples] = useState<SampleTender[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [specificationText, setSpecificationText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(activeRecommendation || null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Sync external recommendation if provided or changed
  useEffect(() => {
    if (activeRecommendation) {
      setResult(activeRecommendation);
    }
  }, [activeRecommendation]);

  // PDF Upload & Extraction State
  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsedPdf, setParsedPdf] = useState<{
    filename: string;
    fileSizeBytes: number;
    pageCount: number;
    extractedText: string;
    extractedClauses: Array<{ title: string; content: string }>;
    suggestedTitle: string;
    detectedCategory: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample tenders
  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await fetch('/api/tenders/samples');
        if (res.ok) {
          const data: SampleTender[] = await res.json();
          setSamples(data);
          // Preload first sample by default
          if (data.length > 0) {
            setSelectedSampleId(data[0].id);
            setSpecificationText(data[0].text);
          }
        }
      } catch (err) {
        console.error('Failed to load sample tenders:', err);
      }
    }
    loadSamples();
  }, []);

  // Handle sample selection change
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const found = samples.find((s) => s.id === sampleId);
    if (found) {
      setSpecificationText(found.text);
    }
  };

  // Upload actual Tender PDF file
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfError('Please upload a valid PDF document (.pdf).');
      return;
    }

    setPdfLoading(true);
    setPdfError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tenders/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to parse tender PDF.');
      }

      const data = await res.json();
      setParsedPdf(data);
      // Auto populate specification text with extracted tender requirements
      setSpecificationText(data.extractedText || '');
      setInputMode('pdf');
    } catch (err: any) {
      setPdfError(err.message || 'Failed to read tender PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  // One-click test with sample tender PDF buffer
  const handleTestSamplePdf = async () => {
    setPdfLoading(true);
    setPdfError(null);

    try {
      const targetId = selectedSampleId || (samples.length > 0 ? samples[0].id : 'sample-tender-1');
      const res = await fetch(`/api/tenders/test-sample-pdf/${targetId}`);
      if (!res.ok) {
        throw new Error('Failed to generate sample tender PDF.');
      }

      const data = await res.json();
      setParsedPdf(data);
      setSpecificationText(data.extractedText || '');
      setInputMode('pdf');
    } catch (err: any) {
      setPdfError(err.message || 'Sample PDF test failed.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Submit analysis
  const handleAnalyze = async () => {
    if (!specificationText.trim()) {
      setError('Please enter a procurement specification or select a sample query.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recommendations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specificationText }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Analysis failed');
      }

      const data: RecommendationResponse = await res.json();
      setResult(data);
      if (onActiveRecommendationChange) {
        onActiveRecommendationChange(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSpecificationText('');
    setSelectedSampleId('');
    setResult(null);
    setError(null);
    if (onActiveRecommendationChange) {
      onActiveRecommendationChange(null);
    }
  };

  // Human-in-the-Loop review actions with instant optimistic UI and toggle support
  const handleReviewAction = async (standardId: string, action: 'approve' | 'reject' | 'reset') => {
    if (!result) return;

    const stdLower = standardId.toLowerCase().trim();

    // Check current status for toggle logic
    const currPrimary = result.primaryRecommendations.find(
      (p) => p.standardId.toLowerCase().trim() === stdLower
    );
    const currRelated = result.relatedStandards.find(
      (r) => r.standardId.toLowerCase().trim() === stdLower
    );
    const currentStatus = (currPrimary || currRelated)?.reviewStatus;

    let targetStatus: 'approved' | 'rejected' | 'pending' =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';

    // If officer clicks the button that corresponds to the active state, toggle back to pending
    if (action === 'approve' && currentStatus === 'approved') {
      targetStatus = 'pending';
    } else if (action === 'reject' && currentStatus === 'rejected') {
      targetStatus = 'pending';
    }

    // Optimistic UI state update immediately
    const updatedPrimary = result.primaryRecommendations.map((p) =>
      p.standardId.toLowerCase().trim() === stdLower ? { ...p, reviewStatus: targetStatus } : p
    );
    const updatedRelated = result.relatedStandards.map((r) =>
      r.standardId.toLowerCase().trim() === stdLower ? { ...r, reviewStatus: targetStatus } : r
    );

    const newResult: RecommendationResponse = {
      ...result,
      primaryRecommendations: updatedPrimary,
      relatedStandards: updatedRelated,
    };

    setResult(newResult);
    if (onActiveRecommendationChange) {
      onActiveRecommendationChange(newResult);
    }

    try {
      const apiAction =
        targetStatus === 'pending' ? 'reset' : targetStatus === 'approved' ? 'approve' : 'reject';
      const endpoint = `/api/recommendations/${result.recommendationId}/${apiAction}`;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardId }),
      });
    } catch (err) {
      console.error('Failed to submit review decision to server:', err);
    }
  };

  // Bulk actions
  const handleApproveAll = async (type: 'primary' | 'all') => {
    if (!result) return;

    const updatedPrimary = result.primaryRecommendations.map((p) => ({
      ...p,
      reviewStatus: 'approved' as const,
    }));
    const updatedRelated =
      type === 'all'
        ? result.relatedStandards.map((r) => ({ ...r, reviewStatus: 'approved' as const }))
        : result.relatedStandards;

    const newResult: RecommendationResponse = {
      ...result,
      primaryRecommendations: updatedPrimary,
      relatedStandards: updatedRelated,
    };
    setResult(newResult);
    if (onActiveRecommendationChange) {
      onActiveRecommendationChange(newResult);
    }

    try {
      await fetch(`/api/recommendations/${result.recommendationId}/approve-all`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to submit bulk approval:', err);
    }
  };

  const handleResetAll = async () => {
    if (!result) return;
    const updatedPrimary = result.primaryRecommendations.map((p) => ({
      ...p,
      reviewStatus: 'pending' as const,
    }));
    const updatedRelated = result.relatedStandards.map((r) => ({
      ...r,
      reviewStatus: 'pending' as const,
    }));

    const newResult: RecommendationResponse = {
      ...result,
      primaryRecommendations: updatedPrimary,
      relatedStandards: updatedRelated,
    };
    setResult(newResult);
    if (onActiveRecommendationChange) {
      onActiveRecommendationChange(newResult);
    }

    try {
      await fetch(`/api/recommendations/${result.recommendationId}/reset-all`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to submit bulk reset to server:', err);
    }
  };

  // Computed approval and rejection counts
  const approvedPrimary = result ? result.primaryRecommendations.filter((p) => p.reviewStatus === 'approved') : [];
  const rejectedPrimary = result ? result.primaryRecommendations.filter((p) => p.reviewStatus === 'rejected') : [];
  const pendingPrimary = result
    ? result.primaryRecommendations.filter((p) => !p.reviewStatus || p.reviewStatus === 'pending')
    : [];

  const approvedRelated = result ? result.relatedStandards.filter((r) => r.reviewStatus === 'approved') : [];
  const rejectedRelated = result ? result.relatedStandards.filter((r) => r.reviewStatus === 'rejected') : [];
  const pendingRelated = result
    ? result.relatedStandards.filter((r) => !r.reviewStatus || r.reviewStatus === 'pending')
    : [];

  const totalApproved = approvedPrimary.length + approvedRelated.length;
  const totalRejected = rejectedPrimary.length + rejectedRelated.length;
  const totalPending = pendingPrimary.length + pendingRelated.length;
  const totalStandards = (result?.primaryRecommendations.length || 0) + (result?.relatedStandards.length || 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-800 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-700"></span>
              <span>Tender Specification Standards Identification</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tender Generator</h2>
            <p className="text-sm text-slate-600 mt-1">
              Analyze procurement specifications and identify potentially applicable Indian Standards, mandatory test methods, normative dependencies, and conformity schemes.
            </p>
          </div>

          {/* Technology Stack Shortcut Button */}
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs text-slate-700 font-medium transition-colors shrink-0 shadow-2xs"
            >
              <Server className="w-4 h-4 text-blue-700" />
              <span>Inspect Tech Stack (PDF, MongoDB, Pinecone)</span>
            </button>
          )}
        </div>

        {/* Infrastructure Status Summary Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1.5">
            <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Active Services:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
              <FileText className="w-3 h-3 mr-1 text-amber-700" />
              PDF Reader (pdf-parse)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px]">
              <Database className="w-3 h-3 mr-1 text-emerald-700" />
              Persistence (MongoDB / Fallback)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px]">
              <Layers className="w-3 h-3 mr-1 text-indigo-700" />
              Vector Store (Pinecone Hybrid)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 text-[11px]">
              <Sparkles className="w-3 h-3 mr-1 text-purple-700" />
              AI Reasoning (Gemini)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Production-ready hybrid retrieval</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        {/* Input Mode Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setInputMode('text')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${inputMode === 'text'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Specification & Samples</span>
            </button>
            <button
              onClick={() => setInputMode('pdf')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${inputMode === 'pdf'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Tender PDF Document</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                pdf-parse
              </span>
            </button>
          </div>

          {inputMode === 'text' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Preloaded Sample:</span>
              <select
                id="sample-selector"
                value={selectedSampleId}
                onChange={(e) => handleSelectSample(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.category}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mode 1: PDF Document Upload & Extraction */}
        {inputMode === 'pdf' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50'
                }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-white rounded-full border border-slate-200 shadow-2xs text-blue-700">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to select tender PDF or drag & drop file here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports public procurement tender documents (.pdf up to 15MB). Extracted via <code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">pdf-parse</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Sample PDF Test Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/60 rounded-md border border-blue-200 text-xs">
              <div className="flex items-center space-x-2 text-blue-900">
                <FileUp className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Don't have a tender PDF handy? Generate and test with a simulated tender PDF:</span>
              </div>
              <button
                type="button"
                onClick={handleTestSamplePdf}
                disabled={pdfLoading}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded font-medium transition-colors flex items-center space-x-1.5 shadow-2xs"
              >
                {pdfLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing PDF Stream...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Test With Sample Tender PDF</span>
                  </>
                )}
              </button>
            </div>

            {pdfError && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}

            {/* Parsed PDF Result Metadata Card */}
            {parsedPdf && (
              <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Tender Document Parsed Successfully</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-semibold">
                    Category: {parsedPdf.detectedCategory}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">File Name</span>
                    <span className="font-semibold text-slate-800 truncate block" title={parsedPdf.filename}>
                      {parsedPdf.filename}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">File Size</span>
                    <span className="font-semibold text-slate-800">
                      {(parsedPdf.fileSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">Page Count</span>
                    <span className="font-semibold text-slate-800">
                      {parsedPdf.pageCount} page(s)
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">Clauses Isolated</span>
                    <span className="font-semibold text-slate-800">
                      {parsedPdf.extractedClauses.length} clause sections
                    </span>
                  </div>
                </div>

                {parsedPdf.extractedClauses.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Extracted Specification Clauses (Applied to Analysis):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedPdf.extractedClauses.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white rounded border border-emerald-300 text-slate-700 text-[11px] shadow-2xs"
                        >
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Specification Text Area (shared between direct input and extracted text review) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="specificationText" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {inputMode === 'pdf' ? 'Extracted Tender Specifications Text' : 'Procurement Requirement Specification Text'}
            </label>
            {inputMode === 'pdf' && (
              <span className="text-xs text-slate-500">
                You can edit or refine the extracted text before running analysis
              </span>
            )}
          </div>
          <textarea
            id="specificationText"
            rows={5}
            value={specificationText}
            onChange={(e) => setSpecificationText(e.target.value)}
            placeholder="Enter product description, technical parameters, performance criteria, or tender clauses..."
            className="w-full text-sm p-3.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-sans leading-relaxed text-slate-900"
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Anti-Hallucination active. Only verified standards from controlled catalog can be surfaced.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="btn-clear"
              onClick={handleClear}
              className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              Clear
            </button>
            <button
              id="btn-analyze"
              disabled={loading}
              onClick={handleAnalyze}
              className="px-6 py-2 rounded bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-semibold transition-colors flex items-center space-x-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Hybrid RAG Pipeline...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Analyze Specification</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="space-y-8 animate-fadeIn">
          {/* ACTION & NAVIGATION BANNER: Officer Verification & Knowledge Graph Discovery */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-lg shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-900/50">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-400/30">
                  Officer Verification Workflow
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center">
                  <Check className="w-3 h-3 mr-1 text-emerald-400" />
                  Approved: <strong className="ml-1 text-emerald-300">{totalApproved}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center">
                  <X className="w-3 h-3 mr-1 text-rose-400" />
                  Rejected: <strong className="ml-1 text-rose-300">{totalRejected}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-amber-400" />
                  Pending: <strong className="ml-1 text-amber-300">{totalPending}</strong>
                </span>
                <span className="text-xs text-slate-300 ml-1">
                  (Total: {totalStandards} Standards)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Tender Recommendation Generated Successfully
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Review candidate standards below. You can approve or reject individual standards, or click <strong>Visualize in Knowledge Graph</strong> to see an interactive relationship map for this tender.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onNavigateToGraph && (
                <button
                  id="btn-view-in-tender-graph-top"
                  onClick={() => onNavigateToGraph(undefined, result)}
                  className="px-4 py-2.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center space-x-2 transition-all ring-1 ring-indigo-400/40 hover:scale-102"
                >
                  <Layers className="w-4 h-4" />
                  <span>Visualize in Knowledge Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                id="btn-generate-tender-summary-top"
                onClick={() => setShowSummaryModal(true)}
                className="px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Final Summary ({totalApproved})</span>
              </button>
            </div>
          </div>

          {/* SECTION A: Procurement Requirement Summary */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-blue-100 text-blue-800">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Section A: Extracted Procurement Requirements
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">ID: {result.recommendationId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-0.5">Identified Product</span>
                <span className="text-slate-900 font-bold">{result.extractedRequirements.productName}</span>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-0.5">Domain Category</span>
                <span className="text-blue-800 font-bold">{result.extractedRequirements.category}</span>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-0.5">Application Context</span>
                <span className="text-slate-900 font-medium">{result.extractedRequirements.application}</span>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium block mb-0.5">Target Operating Environment</span>
                <span className="text-slate-900 font-medium">{result.extractedRequirements.environment}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium block mb-2">Key Technical Parameter Filters:</span>
              <div className="flex flex-wrap gap-2">
                {result.extractedRequirements.keyRequirements.map((req, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-900 text-xs font-medium border border-blue-200"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1.5 text-blue-600" />
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION B: Primary Recommended Standards */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-blue-700 text-white">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Section B: Primary Recommended Indian Standards
                  </h3>
                  <p className="text-xs text-slate-500">
                    Highest-ranking standards matching the core product specification
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveAll('primary')}
                  className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center space-x-1 transition-colors"
                  title="Approve all identified primary standards in this section"
                >
                  <Check className="w-3 h-3" />
                  <span>Approve All Primary</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  title="Reset review decisions back to pending"
                >
                  Reset All
                </button>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {approvedPrimary.length} Approved
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  {rejectedPrimary.length} Rejected
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {pendingPrimary.length} Pending
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  {result.primaryRecommendations.length} Total
                </span>
              </div>
            </div>

            {result.primaryRecommendations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-lg">
                No sufficiently relevant standard was found in the current prototype knowledge base for this specification.
              </div>
            ) : (
              <div className="space-y-6">
                {result.primaryRecommendations.map((std) => (
                  <div
                    key={std.standardId}
                    className={`p-5 rounded-lg border transition-all ${std.reviewStatus === 'approved'
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : std.reviewStatus === 'rejected'
                          ? 'border-rose-400 bg-rose-50/20 opacity-70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-base text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {std.standardNumber}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Year: {std.year}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Status: {std.status}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-800 text-white">
                            Relevance: {std.relevanceScore}%
                          </span>

                          {/* Review status badge */}
                          {std.reviewStatus === 'approved' && (
                            <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                              <Check className="w-3 h-3 mr-1" />
                              Approved by Officer
                            </span>
                          )}
                          {std.reviewStatus === 'rejected' && (
                            <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                              <X className="w-3 h-3 mr-1" />
                              Rejected by Officer
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-base">{std.title}</h4>

                        {/* Explainability paragraph */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                          <span className="font-semibold text-slate-900 block mb-1">Why this was recommended:</span>
                          <p className="leading-relaxed">{std.whyRecommended}</p>
                        </div>

                        {/* Scope */}
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Standard Scope:</strong> {std.scope}
                        </div>

                        {/* Technical Requirements Checklist */}
                        {std.technicalRequirements && std.technicalRequirements.length > 0 && (
                          <div className="pt-2">
                            <span className="text-xs font-semibold text-slate-700 block mb-1">
                              Mandated Technical Specifications:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-600">
                              {std.technicalRequirements.slice(0, 3).map((tr, idx) => (
                                <li key={idx} className="flex items-start space-x-1.5">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <span>{tr}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Source Provenance */}
                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            <strong>Official Source:</strong> {std.source.sourceName}
                          </span>
                          <span>•</span>
                          <span>Last Verified: {std.source.lastVerified}</span>
                          {std.source.sourceUrl && (
                            <a
                              href={std.source.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 hover:underline inline-flex items-center space-x-1"
                            >
                              <span>Official BIS Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Procurement Officer Review Actions */}
                      <div className="flex flex-col gap-2 shrink-0 md:border-l md:border-slate-200 md:pl-4 min-w-[145px]">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                          Officer Action
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReviewAction(std.standardId, 'approve')}
                          className={`px-3 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${std.reviewStatus === 'approved'
                              ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 hover:bg-emerald-800'
                              : 'bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          title={std.reviewStatus === 'approved' ? 'Click to toggle back to pending' : 'Approve for official tender specification'}
                        >
                          <Check className="w-4 h-4" />
                          <span>{std.reviewStatus === 'approved' ? 'Approved ✓' : 'Approve Standard'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewAction(std.standardId, 'reject')}
                          className={`px-3 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${std.reviewStatus === 'rejected'
                              ? 'bg-rose-700 text-white ring-2 ring-rose-500 hover:bg-rose-800'
                              : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                            }`}
                          title={std.reviewStatus === 'rejected' ? 'Click to toggle back to pending' : 'Reject standard'}
                        >
                          <X className="w-4 h-4" />
                          <span>{std.reviewStatus === 'rejected' ? 'Rejected ✗' : 'Reject'}</span>
                        </button>
                        {std.reviewStatus !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleReviewAction(std.standardId, 'reset')}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline text-center pt-0.5"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION C: Related & Allied Standards (Knowledge Graph Expansion) */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-indigo-700 text-white">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Section C: Interconnected Standards (Knowledge Graph Expansion)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Normative references, test methods, safety standards, and installation codes
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {approvedRelated.length} Approved
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  {rejectedRelated.length} Rejected
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {pendingRelated.length} Pending
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {result.relatedStandards.length} Total Connections
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.relatedStandards.map((rel) => (
                <div
                  key={rel.standardId}
                  className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${rel.reviewStatus === 'approved'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : rel.reviewStatus === 'rejected'
                        ? 'border-rose-300 bg-rose-50/20 opacity-70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {rel.standardNumber}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${rel.relationshipType === 'NORMATIVE_REFERENCE'
                            ? 'bg-blue-100 text-blue-800'
                            : rel.relationshipType === 'TEST_METHOD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rel.relationshipType === 'SAFETY_STANDARD'
                                ? 'bg-rose-100 text-rose-800'
                                : rel.relationshipType === 'MATERIAL_STANDARD'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                          }`}
                      >
                        {rel.relationshipType.replace('_', ' ')}
                      </span>
                    </div>

                    <h5 className="font-semibold text-slate-900 text-xs leading-snug">{rel.title}</h5>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-150 leading-relaxed">
                      <strong className="text-slate-800">Connection Rationale:</strong> {rel.reason}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Parent: {rel.parentStandardNumber}</span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleReviewAction(rel.standardId, 'approve')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${rel.reviewStatus === 'approved'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        title={rel.reviewStatus === 'approved' ? 'Click to toggle back to pending' : 'Approve allied code'}
                      >
                        <Check className="w-3 h-3" />
                        <span>{rel.reviewStatus === 'approved' ? 'Approved ✓' : 'Approve'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewAction(rel.standardId, 'reject')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${rel.reviewStatus === 'rejected'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                          }`}
                        title={rel.reviewStatus === 'rejected' ? 'Click to toggle back to pending' : 'Reject allied code'}
                      >
                        <X className="w-3 h-3" />
                        <span>{rel.reviewStatus === 'rejected' ? 'Rejected ✗' : 'Reject'}</span>
                      </button>
                      {rel.reviewStatus !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleReviewAction(rel.standardId, 'reset')}
                          className="text-[10px] text-slate-400 hover:text-slate-700 px-1"
                          title="Reset to Pending"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION D: Version & Amendment Tracking */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-1 rounded bg-amber-700 text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Section D: Version, Amendment & Supersession Status
              </h3>
            </div>

            <div className="space-y-3">
              {result.primaryRecommendations.map((std) => (
                <div key={std.standardId} className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{std.standardNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                      Current Year: {std.year}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-700">
                    <div>
                      <strong className="text-slate-900">Recorded Amendments:</strong>
                    </div>
                    {std.amendments && std.amendments.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                        {std.amendments.map((am, idx) => (
                          <li key={idx}>{am}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic">
                        Version/amendment information is not available in the current prototype knowledge base.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION E: Certification & Conformity Requirements */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-emerald-700 text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Section E: Potentially Applicable Certification & Conformity Schemes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Statutory schemes under BIS Act 2016 and Ministry Quality Control Orders (QCO)
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Official Verification Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.certifications.map((cert) => (
                <div key={cert.certificationId} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-slate-900 text-sm">{cert.name}</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${cert.applicability === 'Potentially Applicable'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                    >
                      {cert.applicability}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <div>
                      <strong className="text-slate-800">Authority:</strong> {cert.authority}
                    </div>
                    <div>
                      <strong className="text-slate-800">Scheme Type:</strong> {cert.schemeType}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                    {cert.reason}
                  </p>

                  <div className="text-[11px] text-slate-500 pt-1">
                    <span>Source: {cert.source.sourceName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION F: Explainable AI Breakdown */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-1 rounded bg-slate-800 text-white">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Section F: Explainable AI Retrieval Scoring Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed mathematical weight breakdown for primary retrieved candidates
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Standard</th>
                    <th className="p-2.5">Semantic (45%)</th>
                    <th className="p-2.5">Scope Match (20%)</th>
                    <th className="p-2.5">Category Match (15%)</th>
                    <th className="p-2.5">Application (10%)</th>
                    <th className="p-2.5">Graph Links (10%)</th>
                    <th className="p-2.5 font-bold text-blue-900">Total Relevance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.primaryRecommendations.map((p) => (
                    <tr key={p.standardId} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{p.standardNumber}</td>
                      <td className="p-2.5">{(p.scoreBreakdown.semanticScore * 100).toFixed(0)}%</td>
                      <td className="p-2.5">{(p.scoreBreakdown.scopeScore * 100).toFixed(0)}%</td>
                      <td className="p-2.5">{(p.scoreBreakdown.categoryScore * 100).toFixed(0)}%</td>
                      <td className="p-2.5">{(p.scoreBreakdown.applicationScore * 100).toFixed(0)}%</td>
                      <td className="p-2.5">{(p.scoreBreakdown.relationshipScore * 100).toFixed(0)}%</td>
                      <td className="p-2.5 font-bold text-blue-800 text-sm">
                        {p.relevanceScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Scoring Methodology Notice:</strong> The relevance score is an AI retrieval and ranking metric calculated from dense cosine similarity and lexical token overlap. It indicates semantic and contextual suitability in the prototype knowledge base, not a formal statutory compliance certificate.
              </span>
            </div>
          </div>

          {/* SECTION G: Human-in-the-Loop Review Summary & Tender Summary Button */}
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 border-l-4 border-amber-500">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Procurement Officer Review Workflow
              </div>
              <h4 className="text-xl font-bold">
                "AI recommends. Procurement officer verifies."
              </h4>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center">
                  <Check className="w-3 h-3 mr-1 text-emerald-400" />
                  Approved: {totalApproved} ({approvedPrimary.length} Primary, {approvedRelated.length} Allied)
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center">
                  <X className="w-3 h-3 mr-1 text-rose-400" />
                  Rejected: {totalRejected} ({rejectedPrimary.length} Primary, {rejectedRelated.length} Allied)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-amber-400" />
                  Pending: {totalPending}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {onNavigateToGraph && (
                <button
                  id="btn-view-in-tender-graph-bottom"
                  onClick={() => onNavigateToGraph(undefined, result)}
                  className="px-5 py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 ring-1 ring-indigo-400/40"
                >
                  <Layers className="w-4 h-4" />
                  <span>View in Knowledge Graph</span>
                </button>
              )}

              <button
                id="btn-generate-tender-summary"
                onClick={() => setShowSummaryModal(true)}
                className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Final Tender Reference Summary</span>
              </button>
            </div>
          </div>

          {/* Final Tender Summary Modal */}
          {showSummaryModal && (
            <TenderSummaryModal
              isOpen={showSummaryModal}
              onClose={() => setShowSummaryModal(false)}
              recommendation={result}
              approvedPrimary={approvedPrimary}
              approvedRelated={approvedRelated}
            />
          )}
        </div>
      )}
    </div>
  );
};
