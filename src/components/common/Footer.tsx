import React from 'react';
import { ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>AI Procurement Standards Assistant</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An AI-powered decision support system developed for public procurement tender committees to rapidly identify applicable Bureau of Indian Standards (BIS) specifications, normative cross-references, and conformity assessment schemes.
            </p>
            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
              Smart India Hackathon Working Prototype
            </div>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Official BIS & Regulatory Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.services.bis.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 flex items-center space-x-1"
                >
                  <span>BIS 'Know Your Standards' Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.crsbis.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 flex items-center space-x-1"
                >
                  <span>Compulsory Registration Scheme (CRS)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://gem.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 flex items-center space-x-1"
                >
                  <span>Government e-Marketplace (GeM)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://dpiit.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 flex items-center space-x-1"
                >
                  <span>DPIIT Quality Control Orders (QCOs)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Governance & Architecture Principles</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Hybrid RAG (Vector Cosine + Lexical Token Search)</li>
              <li>• Knowledge Graph Traversal (Normative & Test Cross-References)</li>
              <li>• Strict Whitelist Grounding (Zero Hallucinated Standards)</li>
              <li>• Mandatory Human-in-the-Loop Procurement Verification</li>
            </ul>
          </div>
        </div>

        {/* Mandatory Legal & Verification Disclaimer */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-start space-x-2 text-slate-400 max-w-3xl">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Mandatory Notice:</strong> Recommendations are AI-assisted decision-support indicators and must be independently verified by the procurement officer against current official Indian Standards and regulatory Gazette notifications before issuing tender specifications.
            </p>
          </div>
          <div className="text-slate-500 whitespace-nowrap">
            Prototype Edition • v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
};
