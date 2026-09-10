import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Layers,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface IntegrationsStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationStatusData {
  mongodb: {
    configured: boolean;
    connected: boolean;
    database: string | null;
    error: string | null;
    mode: string;
  };
  pinecone: {
    configured: boolean;
    connected: boolean;
    indexName: string;
    error: string | null;
    mode: string;
  };
  pdfParser: {
    active: boolean;
    engine: string;
    supportedFormats: string[];
    maxFileSizeMb: number;
    features: string[];
  };
  gemini: {
    configured: boolean;
    model: string;
    mode: string;
  };
}

export const IntegrationsStatusModal: React.FC<IntegrationsStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<IntegrationStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncingPinecone, setSyncingPinecone] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/integrations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch integration status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleSyncPinecone = async () => {
    setSyncingPinecone(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/system/pinecone/sync', { method: 'POST' });
      const json = await res.json();
      setSyncResult(
        json.status === 'synced'
          ? `Successfully synced ${json.recordsSynced} standards to Pinecone index!`
          : `Pinecone key unset: Running in high-performance embedded vector mode (${json.recordsSynced || 0} standards available).`
      );
      fetchStatus();
    } catch (err: any) {
      setSyncResult(`Sync error: ${err.message}`);
    } finally {
      setSyncingPinecone(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-700 rounded-lg text-white">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Technology Stack & Integrations Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-stack audit of PDF parsing, MongoDB persistence, Pinecone vector store, and Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm">
          {/* Architecture Overview Flow */}
          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
            <div className="font-bold flex items-center space-x-1.5 uppercase tracking-wider text-[11px] text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>End-to-End Procurement Intelligence Pipeline</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 font-medium text-center">
              <div className="bg-white p-2.5 rounded border border-blue-200 flex flex-col items-center">
                <FileText className="w-4 h-4 text-blue-700 mb-1" />
                <span className="font-bold text-slate-900">1. PDF Reader</span>
                <span className="text-[10px] text-slate-500">Tender clauses extracted via pdf-parse</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-blue-200 flex flex-col items-center">
                <Layers className="w-4 h-4 text-indigo-700 mb-1" />
                <span className="font-bold text-slate-900">2. Pinecone / RAG</span>
                <span className="text-[10px] text-slate-500">Dense vector similarity search</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-blue-200 flex flex-col items-center">
                <Sparkles className="w-4 h-4 text-amber-600 mb-1" />
                <span className="font-bold text-slate-900">3. Gemini AI</span>
                <span className="text-[10px] text-slate-500">Grounded analysis & standards synthesis</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-blue-200 flex flex-col items-center">
                <Database className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="font-bold text-slate-900">4. MongoDB</span>
                <span className="text-[10px] text-slate-500">Persistent tender & audit storage</span>
              </div>
            </div>
          </div>

          {/* 4 Core Technology Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. PDF Parsing */}
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-amber-100 text-amber-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Tender PDF Parsing</h4>
                    <span className="text-[11px] text-slate-500">Engine: pdf-parse v1.1.1</span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Procurement officers can upload actual government tender documents (.pdf). The server parses PDF byte buffers, calculates page counts, isolates technical specification clauses, and auto-detects product categories.
              </p>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <div className="font-semibold text-slate-700">Capabilities:</div>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                  <li>Multipart file upload (`/api/tenders/upload-pdf`)</li>
                  <li>Base64 drag-and-drop parser (`/api/tenders/parse-pdf-base64`)</li>
                  <li>Automatic clause & requirements segmentation</li>
                </ul>
              </div>
            </div>

            {/* 2. MongoDB Database */}
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-emerald-100 text-emerald-800">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">MongoDB Persistence</h4>
                    <span className="text-[11px] text-slate-500">Official MongoDB Node Driver</span>
                  </div>
                </div>
                {data?.mongodb?.connected ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                    Embedded Fallback
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stores parsed tender documents, recommendation runs, and officer approvals/rejections in collections: <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">recommendations</code>, <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">review_decisions</code>, and <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">tender_documents</code>.
              </p>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Environment Variable:</span>
                  <span className="font-mono text-slate-700">MONGODB_URI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Operating Mode:</span>
                  <span className="font-semibold text-slate-800">{data?.mongodb?.mode || 'Checking...'}</span>
                </div>
              </div>
            </div>

            {/* 3. Pinecone Vector DB */}
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-indigo-100 text-indigo-800">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Pinecone Vector DB</h4>
                    <span className="text-[11px] text-slate-500">@pinecone-database/pinecone</span>
                  </div>
                </div>
                {data?.pinecone?.connected ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                    Embedded Vector Engine
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowers high-dimensional vector search across Indian Standards. When <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">PINECONE_API_KEY</code> is configured, the system indexes standard embeddings in Pinecone and queries vectors in real-time.
              </p>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Environment Variables:</span>
                  <span className="font-mono text-slate-700">PINECONE_API_KEY, PINECONE_INDEX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Index:</span>
                  <span className="font-mono text-slate-700">{data?.pinecone?.indexName || 'bis-procurement-standards'}</span>
                </div>
              </div>
              <div className="pt-1">
                <button
                  onClick={handleSyncPinecone}
                  disabled={syncingPinecone}
                  className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  {syncingPinecone ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing Standards to Vector Store...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Test / Sync BIS Standards to Vector Index</span>
                    </>
                  )}
                </button>
                {syncResult && (
                  <p className="text-[11px] text-indigo-700 mt-1.5 bg-indigo-50/60 p-2 rounded border border-indigo-100">
                    {syncResult}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Gemini AI */}
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-purple-100 text-purple-800">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Gemini Generative AI</h4>
                    <span className="text-[11px] text-slate-500">@google/genai TypeScript SDK</span>
                  </div>
                </div>
                {data?.gemini?.configured ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Offline Grounded Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Server-side LLM for generating grounded justifications, synthesizing tender clauses, and explaining why specific Indian Standards apply to technical parameters.
              </p>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Environment Variable:</span>
                  <span className="font-mono text-slate-700">GEMINI_API_KEY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="font-semibold text-slate-800">{data?.gemini?.model || 'gemini-2.5-flash'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zero-Downtime Fallback Note */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Resilient Zero-Downtime Dual-Engine Architecture</span>
            </div>
            <p className="leading-relaxed">
              All external cloud technologies (<strong className="font-semibold text-slate-800">MongoDB</strong>, <strong className="font-semibold text-slate-800">Pinecone</strong>, and <strong className="font-semibold text-slate-800">Gemini</strong>) are designed with automatic fallbacks. If an API key or database connection string is not provided, the application runs entirely locally using its embedded high-speed Cosine Vector Retrieval Engine and in-memory persistent store. When keys are set in <code className="text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-300 font-mono">.env</code>, the app connects directly to the live cloud services without breaking execution!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition-colors"
          >
            Close Architecture Panel
          </button>
        </div>
      </div>
    </div>
  );
};
