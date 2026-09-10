import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Layers,
  FileCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { EvaluationResult } from '../../types';

export const EvaluationView: React.FC = () => {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runEvaluation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluation/run');
      if (res.ok) {
        const data: EvaluationResult = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Failed to run evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  const hallucinationLayers = [
    {
      layer: 'Layer 1',
      title: 'Constrained Context Construction',
      desc: 'Only authentic standards pre-indexed in the verified knowledge base are injected as candidate references.',
    },
    {
      layer: 'Layer 2',
      title: 'Domain Relevance Scoring',
      desc: 'Multi-factor hybrid ranking (semantic, scope, category, application, relationship) ensures high precision.',
    },
    {
      layer: 'Layer 3',
      title: 'Deterministic Whitelist Filtering',
      desc: 'All candidate standard numbers are validated against the authoritative Bureau of Indian Standards master catalog.',
    },
    {
      layer: 'Layer 4',
      title: 'Database Cross-Reference Check',
      desc: 'Every candidate ID is matched against MongoDB/JSON store records to confirm active status and existence.',
    },
    {
      layer: 'Layer 5',
      title: 'Automatic Stripping of Unknown Codes',
      desc: 'Any standard ID not verified in the local catalog is systematically expunged before reaching the frontend.',
    },
    {
      layer: 'Layer 6',
      title: 'Insufficient Evidence Guard',
      desc: 'If candidate score falls below the 0.35 confidence threshold, the engine explicitly returns "No sufficiently relevant standard found".',
    },
    {
      layer: 'Layer 7',
      title: 'Human-in-the-Loop Governance',
      desc: 'Final procurement clauses cannot be compiled without explicit approval by the designated procurement officer.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Retrieval Accuracy & Hallucination Prevention Verification</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Evaluation Benchmarks & Precision Metrics
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Automated test suite executing 15 domain-specific procurement queries to measure Hit@1, Hit@3, MRR@5, and latency.
          </p>
        </div>

        <button
          id="btn-rerun-eval"
          onClick={runEvaluation}
          disabled={loading}
          className="px-4 py-2.5 rounded bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-semibold flex items-center space-x-2 transition-colors shrink-0 shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running Evaluation...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Rerun Benchmark Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Metric Cards */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hit@1 Accuracy</span>
            <div className="mt-2 text-3xl font-extrabold text-blue-700">
              {(result.hitAt1 * 100).toFixed(0)}%
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Top-1 candidate is exact target standard</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hit@3 Recall</span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700">
              {(result.hitAt3 * 100).toFixed(0)}%
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Target standard in top 3 recommendations</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">MRR@5</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {result.mrrAt5.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Mean Reciprocal Rank across test queries</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Average Latency</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 flex items-baseline space-x-1">
              <span>{result.avgLatencyMs}</span>
              <span className="text-sm font-normal text-slate-500">ms</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Sub-millisecond hybrid vector retrieval</div>
          </div>
        </div>
      )}

      {/* 7 Layers of Anti-Hallucination Architecture */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">
            7-Layer Anti-Hallucination & Grounding Framework
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict multi-layered verification preventing the generation of invented or non-existent Indian Standard numbers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hallucinationLayers.map((l, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
                {l.layer}
              </span>
              <h4 className="font-bold text-slate-900 text-xs mt-1">{l.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{l.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Query Benchmark Results Table */}
      {result && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-2">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Automated Benchmark Test Cases</h3>
              <p className="text-xs text-slate-500">15 verification queries covering all 5 procurement domains</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
              {result.details.length} Test Queries Executed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Query ID</th>
                  <th className="p-3">Procurement Query</th>
                  <th className="p-3">Expected Standard</th>
                  <th className="p-3">Top-1 Retrieved</th>
                  <th className="p-3 text-center">Hit@1</th>
                  <th className="p-3 text-center">Hit@3</th>
                  <th className="p-3 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.details.map((item) => (
                  <tr key={item.queryId} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.queryId}</td>
                    <td className="p-3 text-slate-800 max-w-sm">{item.query}</td>
                    <td className="p-3 font-mono text-slate-700">{item.expectedPrimary}</td>
                    <td className="p-3 font-mono font-semibold text-blue-900">
                      {item.topRetrieved[0] || 'None'}
                    </td>
                    <td className="p-3 text-center">
                      {item.hit1 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 inline" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.hit3 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 inline" />
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">{item.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
