import React, { useState } from 'react';
import { X, Copy, Check, Printer, ShieldCheck, FileText, Download } from 'lucide-react';
import { RecommendationResponse, PrimaryRecommendation, RelatedStandardRecommendation } from '../../types';

interface TenderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RecommendationResponse;
  approvedPrimary: PrimaryRecommendation[];
  approvedRelated: RelatedStandardRecommendation[];
}

export const TenderSummaryModal: React.FC<TenderSummaryModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  approvedPrimary,
  approvedRelated,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const req = recommendation.extractedRequirements;

  // Group approved related standards by relationship type
  const normativeStds = approvedRelated.filter(r => r.relationshipType === 'NORMATIVE_REFERENCE');
  const testStds = approvedRelated.filter(r => r.relationshipType === 'TEST_METHOD');
  const safetyStds = approvedRelated.filter(r => r.relationshipType === 'SAFETY_STANDARD');
  const materialStds = approvedRelated.filter(r => r.relationshipType === 'MATERIAL_STANDARD');
  const installStds = approvedRelated.filter(r => r.relationshipType === 'INSTALLATION_STANDARD');
  const otherRelated = approvedRelated.filter(r => r.relationshipType === 'RELATED_TO');

  const tenderText = `
GOVERNMENT OF INDIA / PUBLIC PROCUREMENT TENDER ANNEXURE
TECHNICAL STANDARDS AND MANDATORY BIS CONFORMITY REQUIREMENTS

Tender Reference Identifier: ${recommendation.recommendationId}
Date of Generation: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Product Category: ${req.productName} (${req.category})
Application Domain: ${req.application}
Operating Environment: ${req.environment}

1.0 PRIMARY MANDATORY INDIAN STANDARDS (BIS SPECIFICATIONS)
The equipment/materials supplied under this tender must strictly conform to the design, manufacturing, and performance requirements specified in the following Indian Standards (latest revisions and published amendments):
${approvedPrimary.length > 0 ? approvedPrimary.map((p, idx) => `  1.${idx + 1} ${p.standardNumber} - "${p.title}" (Status: ${p.status}, Year: ${p.year})`).join('\n') : '  [No primary standards approved by procurement officer]'}

2.0 NORMATIVE REFERENCES & SUBSIDIARY SAFETY CODES
The primary equipment must satisfy all interconnected safety and component standards referenced normatively:
${normativeStds.length > 0 ? normativeStds.map((r, idx) => `  2.${idx + 1} ${r.standardNumber} - ${r.title} [Normative Reference]`).join('\n') : '  None specified.'}
${safetyStds.length > 0 ? safetyStds.map((r, idx) => `  2.${normativeStds.length + idx + 1} ${r.standardNumber} - ${r.title} [Safety Standard]`).join('\n') : ''}

3.0 MANDATORY TEST METHODS & FACTORY QUALITY ASSURANCE
Bidders must submit NABL accredited / BIS recognized laboratory test reports covering the following test protocols:
${testStds.length > 0 ? testStds.map((r, idx) => `  3.${idx + 1} ${r.standardNumber} - ${r.title} [Test Method Protocol]`).join('\n') : '  Factory acceptance tests per standard testing schedule.'}

4.0 RAW MATERIAL & SUB-ASSEMBLY CONFORMITY
${materialStds.length > 0 ? materialStds.map((r, idx) => `  4.${idx + 1} ${r.standardNumber} - ${r.title} [Material Specification]`).join('\n') : '  All materials must be virgin, first-quality grade.'}

5.0 SITE COMMISSIONING & EARTHING INSTALLATION STANDARDS
${installStds.length > 0 ? installStds.map((r, idx) => `  5.${idx + 1} ${r.standardNumber} - ${r.title} [Installation & Earthing Code]`).join('\n') : '  Standard CPWD / State PWD electrical installation specifications.'}

6.0 STATUTORY CERTIFICATION AND BIS MARKING REQUIREMENTS
Bidders must hold valid licenses/registrations at the time of bid submission:
${recommendation.certifications.map((c, idx) => `  6.${idx + 1} ${c.name} (${c.schemeType}) under ${c.authority} - Applicability: ${c.applicability}`).join('\n')}

7.0 PROCUREMENT OFFICER VERIFICATION & SIGN-OFF
This annexure has been reviewed and verified by the designated procurement official.
Status: Human Procurement Officer Verified
Total Approved Standards: ${approvedPrimary.length + approvedRelated.length}
Verification Note: All bidders must submit genuine BIS CML licenses or CRS R-numbers with bid documents.
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(tenderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-blue-700 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Final Procurement Standards Annexure</h3>
              <p className="text-xs text-slate-500">Official tender clause compiled exclusively from human-approved standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs sm:text-sm text-slate-800">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>
                <strong>Verification Completed:</strong> {approvedPrimary.length} Primary Standard(s), {approvedRelated.length} Allied Code(s) approved for insertion.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-blue-200/70 px-2 py-0.5 rounded text-blue-900 font-semibold">
              {recommendation.recommendationId}
            </span>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[55vh] overflow-y-auto border border-slate-800">
              {tenderText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-lg">
          <div className="text-xs text-slate-500">
            Ready for integration into GeM (Government e-Marketplace) or tender portal.
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Annexure</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Tender Clause'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
