// @ts-ignore
import * as pdfParseImport from 'pdf-parse';
const pdfParse: any = (pdfParseImport as any).default || pdfParseImport;

export interface ParsedTenderPdfResult {
  filename: string;
  fileSizeBytes: number;
  pageCount: number;
  extractedText: string;
  extractedClauses: Array<{
    title: string;
    content: string;
  }>;
  suggestedTitle: string;
  detectedCategory: string;
}

/**
 * Extracts clauses and sections from parsed tender text
 */
function extractClausesFromText(text: string): Array<{ title: string; content: string }> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const clauses: Array<{ title: string; content: string }> = [];
  let currentTitle = 'General Scope & Overview';
  let currentContent: string[] = [];

  const sectionKeywords = [
    /^(section|clause|part|item|annexure|schedule)\s+([0-9ivx]+|[a-z])/i,
    /^(technical\s+specifications?|specifications?|scope\s+of\s+work|applicable\s+standards|standards\s+and\s+codes|materials?\s+and\s+workmanship|compliance\s+requirements?|testing\s+and\s+inspection|safety\s+requirements?|general\s+conditions?)/i,
  ];

  for (const line of lines) {
    const isHeader = sectionKeywords.some(pattern => pattern.test(line)) && line.length < 80;
    if (isHeader) {
      if (currentContent.length > 0) {
        clauses.push({
          title: currentTitle,
          content: currentContent.join(' ').substring(0, 1500),
        });
        currentContent = [];
      }
      currentTitle = line;
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    clauses.push({
      title: currentTitle,
      content: currentContent.join(' ').substring(0, 1500),
    });
  }

  return clauses.slice(0, 8);
}

/**
 * Detects appropriate category based on keywords in extracted text
 */
function detectCategoryFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('led') || lower.includes('luminaire') || lower.includes('lighting') || lower.includes('street light')) {
    return 'Lighting';
  }
  if (lower.includes('cement') || lower.includes('concrete') || lower.includes('reinforcement') || lower.includes('opc') || lower.includes('ppc')) {
    return 'Civil & Construction';
  }
  if (lower.includes('pv') || lower.includes('solar') || lower.includes('inverter') || lower.includes('photovoltaic')) {
    return 'Renewable Energy';
  }
  if (lower.includes('pvc') || lower.includes('pipe') || lower.includes('plumbing') || lower.includes('hdpe') || lower.includes('drainage')) {
    return 'Piping & Water Supply';
  }
  if (lower.includes('helmet') || lower.includes('safety shoe') || lower.includes('ppe') || lower.includes('vest')) {
    return 'Personal Protective Equipment';
  }
  if (lower.includes('cable') || lower.includes('conductor') || lower.includes('transformer') || lower.includes('switchgear')) {
    return 'Electrical';
  }
  return 'General Engineering';
}

/**
 * Parse PDF Buffer using pdf-parse
 */
export async function parseTenderPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedTenderPdfResult> {
  const data = await pdfParse(buffer);
  const text = data.text ? data.text.trim() : '';

  const clauses = extractClausesFromText(text);
  const detectedCategory = detectCategoryFromText(text);

  // Extract a clean title from first few lines or filename
  const firstLines = text.split('\n').slice(0, 5).map(l => l.trim()).filter(l => l.length > 5);
  const suggestedTitle = firstLines.length > 0 
    ? firstLines[0].substring(0, 90) 
    : filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  return {
    filename,
    fileSizeBytes: buffer.length,
    pageCount: data.numpages || 1,
    extractedText: text,
    extractedClauses: clauses,
    suggestedTitle,
    detectedCategory,
  };
}

/**
 * Creates a valid PDF binary buffer for sample testing
 */
export function createSamplePdfBuffer(title: string, text: string): Buffer {
  const sanitizedTitle = title.replace(/[()\\]/g, '');
  const sanitizedText = text.replace(/[()\\]/g, '');
  
  // Wrap lines for PDF BT stream
  const chunk1 = sanitizedText.slice(0, 80);
  const chunk2 = sanitizedText.slice(80, 160);
  const chunk3 = sanitizedText.slice(160, 240);
  const chunk4 = sanitizedText.slice(240, 320);

  const streamContent = `BT
/F1 14 Tf
50 720 Td
(${sanitizedTitle}) Tj
/F1 10 Tf
0 -30 Td
(${chunk1}) Tj
0 -18 Td
(${chunk2}) Tj
0 -18 Td
(${chunk3}) Tj
0 -18 Td
(${chunk4}) Tj
ET`;

  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
530
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

