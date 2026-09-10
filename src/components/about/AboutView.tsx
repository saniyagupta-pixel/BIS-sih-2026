import React from 'react';
import {
  Info,
  Layers,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileText,
  Network,
  Cpu,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface AboutViewProps {
  onOpenIntegrations?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onOpenIntegrations }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-800 mb-1">
          <Info className="w-4 h-4 text-blue-700" />
          <span>System Architecture & Operational Methodology</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          About the AI Procurement Standards Assistant
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Comprehensive guide explaining the hybrid RAG architecture, knowledge graph expansion, anti-hallucination mechanisms, and human-in-the-loop procurement governance.
        </p>
      </div>

      {/* 1. What is the system? */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <FileText className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-slate-900 text-base">What is this System?</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          The AI Procurement Standards Assistant is an intelligent decision-support system built for the Smart India Hackathon. It assists government procurement officers, technical tender drafting committees, and specification engineers in rapidly identifying the exact Indian Standards (BIS codes) applicable to a given procurement requirement.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          In public procurement under the General Financial Rules (GFR 2017) and Government e-Marketplace (GeM) directives, specifying authentic, up-to-date Indian Standards and Quality Control Order (QCO) compliance is legally required to guarantee quality, safety, and level-playing field competition.
        </p>
      </div>

      {/* 2. What is Hybrid RAG? */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Cpu className="w-5 h-5 text-indigo-700" />
          <h3 className="font-bold text-slate-900 text-base">What is Hybrid RAG?</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Retrieval-Augmented Generation (RAG) is an AI architecture that retrieves verified factual records from a controlled database before generating answers, rather than relying on an LLM's raw memory.
        </p>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-900 uppercase">Hybrid Scoring Formula:</div>
          <div className="font-mono text-slate-800 bg-white p-2.5 rounded border border-slate-300">
            Final Score = 0.45 * SemanticCosScore + 0.20 * ScopeMatch + 0.15 * CategoryMatch + 0.10 * ApplicationMatch + 0.10 * RelationshipScore
          </div>
          <p className="text-slate-600 leading-relaxed">
            By combining dense semantic representations with precise lexical token matches (BM25) and domain category filters, the system avoids common pitfalls of keyword-only search while preserving exact standard number precision.
          </p>
        </div>
      </div>

      {/* 3. What is the Knowledge Graph? */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Network className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-base">What is the Standards Knowledge Graph?</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Indian Standards do not exist in isolation. A single primary standard (for instance, IS 10322 for LED Street Lighting) normatively mandates compliance with subordinate safety standards (IS 15885 for LED drivers), performance test methods (IS 16102 Part 2), and installation earthing codes (IS 3043).
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Our system models standards as an interconnected graph. When a primary standard is retrieved, the engine traverses relationships across 1 to 2 hops to surface:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <strong className="text-blue-900 block mb-1">Normative References:</strong>
            Standards legally indispensable for the application of the primary standard.
          </div>
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
            <strong className="text-emerald-900 block mb-1">Mandatory Test Methods:</strong>
            Standardized laboratory test protocols (photometric, shock, tensile, drop).
          </div>
          <div className="p-3 bg-rose-50 rounded border border-rose-200">
            <strong className="text-rose-900 block mb-1">Safety Standards:</strong>
            Electrical shock protection, insulation, flame retardance, and toxic leaching limits.
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <strong className="text-amber-900 block mb-1">Material Standards:</strong>
            Raw material requirements (Fe 500D steel, OPC cement grades, copper conductor).
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <strong className="text-purple-900 block mb-1">Installation Standards:</strong>
            On-site erection, soil earthing electrodes, and commissioning codes.
          </div>
          <div className="p-3 bg-slate-100 rounded border border-slate-300">
            <strong className="text-slate-900 block mb-1">Allied Standards:</strong>
            Complementary equipment co-procured in identical tender packages.
          </div>
        </div>
      </div>

      {/* 4. Technology Stack & Enterprise Backend Architecture */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-slate-900 text-base">
              Enterprise Backend Stack: PDF Parsing, MongoDB, Pinecone & Gemini
            </h3>
          </div>
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
            >
              <span>Inspect Live Integrations</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          The system incorporates four complementary layers designed to process unformatted procurement documents into strictly verified standards recommendations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1.5">
            <div className="font-bold text-amber-900 text-sm flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>1. Tender PDF Ingestion (`pdf-parse`)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Handles raw tender files uploaded via multipart form data or base64 streams. Calculates page counts, parses byte buffers into clean text, isolates clauses (technical specifications, scopes, testing schedules), and auto-detects target procurement categories.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="font-bold text-emerald-900 text-sm flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>2. MongoDB Persistence Layer (`mongodb`)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Persists uploaded tender documents, recommendation payloads, and officer review decisions (approvals, rejections, custom notes) in collections: <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono">recommendations</code>, <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono">review_decisions</code>, and <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono">tender_documents</code>.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-1.5">
            <div className="font-bold text-indigo-900 text-sm flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-700" />
              <span>3. Pinecone Vector Retrieval (`@pinecone-database/pinecone`)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Indexes high-dimensional vector representations of Indian Standards. Blends vector cosine similarity (50%) with domain lexical matching (50%) to yield resilient hybrid RAG rankings with zero out-of-catalog hallucinations.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50/70 border border-purple-200 space-y-1.5">
            <div className="font-bold text-purple-900 text-sm flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-purple-700" />
              <span>4. Grounded Gemini AI Engine (`@google/genai`)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Powers server-side prompt engineering, generating concise procurement justifications, clause-level cross-references, and tender checklist summaries strictly confined to the retrieved standard IDs.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
          <strong className="text-slate-900">Zero-Downtime Design:</strong> If cloud environment variables (<code className="font-mono text-slate-800">MONGODB_URI</code> or <code className="font-mono text-slate-800">PINECONE_API_KEY</code>) are not configured, the system automatically falls back to its embedded vector scoring engine and in-memory persistent stores without throwing fatal startup exceptions.
        </div>
      </div>

      {/* 5. Why Human Verification is Required */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <UserCheck className="w-5 h-5 text-amber-700" />
          <h3 className="font-bold text-slate-900 text-base">Why Human Verification is Mandatory</h3>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 leading-relaxed space-y-2">
          <p className="font-bold">
            "AI recommends. Procurement officer verifies."
          </p>
          <p>
            Public procurement decisions carry substantial legal and financial accountability. AI models must never autonomously commit the government to contractual or regulatory terms. The procurement officer remains the ultimate authority, actively approving or rejecting each surfaced standard based on their project's site conditions and administrative approval.
          </p>
        </div>
      </div>

      {/* 5. Prototype Scope and Limitations */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <AlertTriangle className="w-5 h-5 text-rose-700" />
          <h3 className="font-bold text-slate-900 text-base">Prototype Limitations & Verification Advisory</h3>
        </div>
        <ul className="list-disc list-inside space-y-2 text-xs text-slate-700 leading-relaxed pl-1">
          <li>
            <strong>Curated Subset:</strong> This prototype indexes 21 verified Indian Standards across five key domains (Lighting, Industrial Safety, Electrical Distribution, Water & Plumbing, and Construction Materials) and 6 certification schemes. It does not claim to index the entire BIS library of over 20,000 standards.
          </li>
          <li>
            <strong>Official Verification:</strong> Always cross-verify standard numbers, active years, and recent amendments on the official Bureau of Indian Standards portal (<a href="https://services.bis.gov.in" target="_blank" rel="noreferrer" className="text-blue-700 underline">services.bis.gov.in</a>) before publishing tender documents.
          </li>
          <li>
            <strong>No Statutory Claim:</strong> Relevance scores reflect algorithmic semantic and lexical alignment; they do not constitute legal conformity certification.
          </li>
        </ul>
      </div>
    </div>
  );
};
