// pdf-parse v2 API
// Import CanvasFactory before PDFParse so the parser also works in
// serverless environments such as Vercel.
import { CanvasFactory } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

// ==================================================
// Parsed Standard
// ==================================================

export interface ParsedStandard {
  standardId: string;
  standardNumber: string;
  title: string;
  year: number;

  category: string;
  scope: string;
  description: string;

  keywords: string[];
  technicalRequirements: string[];
  applications: string[];

  normativeReferences: string[];
  alliedStandards: string[];
  testMethods: string[];
  safetyStandards: string[];
  materialStandards: string[];
  installationStandards: string[];

  supersedes: string | null;
  supersededBy: string | null;

  amendments: string[];
  certificationIds: string[];

  source: {
    sourceName: string;
    sourceType: string;
    sourceUrl: string;
    lastVerified: string;
  };
}

// ==================================================
// Parsed Tender PDF Result
// ==================================================

export interface ParsedTenderPdfResult {
  filename: string;
  fileSizeBytes: number;
  pageCount: number;
  extractedText: string;

  extractedClauses: Array<{
    title: string;
    content: string;
  }>;

  extractedKeyValues: Array<{
    key: string;
    value: string;
  }>;

  parsedStandards: ParsedStandard[];

  suggestedTitle: string;
  detectedCategory: string;
}

// ==================================================
// Extract clauses from PDF text
// ==================================================

function extractClausesFromText(
  text: string
): Array<{ title: string; content: string }> {

  // PDF extraction may remove most newlines,
  // so normalize whitespace.
  const normalizedText = text
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const clauses: Array<{
    title: string;
    content: string;
  }> = [];

  /*
    Match detailed BIS standard entries.

    Examples:

    IS 10322 (Part 1):2026
    IS 10322 (Part 5/Sec 3):2026
    IS 302 (Part 1):2024
    IS 694:2010
    IS 456:2000
  */

  const standardPattern =
    /IS\s+\d+(?:\s+\(Part\s+\d+(?:\/Sec\s+\d+)?\))?(?::\d{4})?/g;

  const matches = [
    ...normalizedText.matchAll(standardPattern)
  ];

  for (let i = 0; i < matches.length; i++) {

    const standardNumber = matches[i][0];

    const start =
      matches[i].index ?? 0;

    const end =
      i + 1 < matches.length
        ? matches[i + 1].index ??
          normalizedText.length
        : normalizedText.length;

    let content = normalizedText
      .substring(start, end)
      .trim();

    /*
      Only keep entries containing Title:.

      This removes summary-table occurrences
      that don't contain the detailed standard data.
    */

    if (!/\bTitle\s*:/i.test(content)) {
      continue;
    }

    // Remove the standard number from the beginning.
    content = content
      .replace(
        new RegExp(
          '^' +
            standardNumber.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            )
        ),
        ''
      )
      .trim();

    clauses.push({
      title: standardNumber,
      content: content.substring(0, 1500)
    });
  }

  console.log(
    '[PDF Parser] Standards detected:',
    clauses.length
  );

  return clauses;
}

// ==================================================
// Detect broad category
// ==================================================

function detectCategoryFromText(
  text: string
): string {

  const lower = text.toLowerCase();

  if (
    lower.includes('led') ||
    lower.includes('luminaire') ||
    lower.includes('lighting') ||
    lower.includes('street light')
  ) {
    return 'Lighting';
  }

  if (
    lower.includes('cement') ||
    lower.includes('concrete') ||
    lower.includes('reinforcement') ||
    lower.includes('opc') ||
    lower.includes('ppc')
  ) {
    return 'Civil & Construction';
  }

  if (
    lower.includes('pv') ||
    lower.includes('solar') ||
    lower.includes('inverter') ||
    lower.includes('photovoltaic')
  ) {
    return 'Renewable Energy';
  }

  if (
    lower.includes('pvc') ||
    lower.includes('pipe') ||
    lower.includes('plumbing') ||
    lower.includes('hdpe') ||
    lower.includes('drainage')
  ) {
    return 'Piping & Water Supply';
  }

  if (
    lower.includes('helmet') ||
    lower.includes('safety shoe') ||
    lower.includes('ppe') ||
    lower.includes('vest')
  ) {
    return 'Personal Protective Equipment';
  }

  if (
    lower.includes('cable') ||
    lower.includes('conductor') ||
    lower.includes('transformer') ||
    lower.includes('switchgear')
  ) {
    return 'Electrical';
  }

  return 'General Engineering';
}

// ==================================================
// Create stable standard ID
// ==================================================

function createStandardId(
  standardNumber: string
): string {

  return standardNumber
    .toLowerCase()
    .replace(/^is\s*/, 'is-')
    .replace(/[:()/]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '');
}

// ==================================================
// Extract a field from a clause
// ==================================================

function extractField(
  content: string,
  fieldName: string,
  nextFields: string[]
): string {

  const escapedField =
    fieldName.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  const nextPattern =
    nextFields.length > 0
      ? `(?=\\b(?:${nextFields
          .map(
            f =>
              f.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              )
          )
          .join('|')})\\s*:)`
      : '$';

  const regex = new RegExp(
    `\\b${escapedField}\\s*:\\s*(.*?)(?:${nextPattern})`,
    'i'
  );

  const match =
    content.match(regex);

  return match?.[1]?.trim() || '';
}

// ==================================================
// Parse structured standards
// ==================================================

function parseStructuredStandards(
  clauses: Array<{
    title: string;
    content: string;
  }>
): ParsedStandard[] {

  const fields = [
    'Title',
    'Domain',
    'Category',
    'Explanation',
    'Scope',
    'Retrieval Keywords',
    'Typical Tender Requirements to Extract',
    'Related Standards/Relationships',
    'Source',
    'Pinecone Metadata'
  ];

  return clauses.map((clause) => {

    const standardNumber =
      clause.title.trim();

    // ----------------------------------------------
    // Year
    // ----------------------------------------------

    const yearMatch =
      standardNumber.match(/(\d{4})$/);

    const year =
      yearMatch
        ? Number(yearMatch[1])
        : 0;

    // ----------------------------------------------
    // Title
    // ----------------------------------------------

    const title =
      extractField(
        clause.content,
        'Title',
        fields.filter(
          f => f !== 'Title'
        )
      );

    // ----------------------------------------------
    // Domain
    // ----------------------------------------------

    const domain =
      extractField(
        clause.content,
        'Domain',
        fields.filter(
          f => f !== 'Domain'
        )
      );

    // ----------------------------------------------
    // Category
    // ----------------------------------------------

    const category =
      extractField(
        clause.content,
        'Category',
        fields.filter(
          f => f !== 'Category'
        )
      ) ||
      domain ||
      'General Engineering';

    // ----------------------------------------------
    // Explanation
    // ----------------------------------------------

    const explanation =
      extractField(
        clause.content,
        'Explanation',
        fields.filter(
          f => f !== 'Explanation'
        )
      );

    // ----------------------------------------------
    // Scope
    // ----------------------------------------------

    const scope =
      extractField(
        clause.content,
        'Scope',
        fields.filter(
          f => f !== 'Scope'
        )
      );

    // ----------------------------------------------
    // Retrieval Keywords
    // ----------------------------------------------

    const keywordText =
      extractField(
        clause.content,
        'Retrieval Keywords',
        fields.filter(
          f => f !== 'Retrieval Keywords'
        )
      );

    // ----------------------------------------------
    // Tender Requirements
    // ----------------------------------------------

    const requirementText =
      extractField(
        clause.content,
        'Typical Tender Requirements to Extract',
        fields.filter(
          f =>
            f !==
            'Typical Tender Requirements to Extract'
        )
      );

    // ----------------------------------------------
    // Relationships
    // ----------------------------------------------

    const relationshipText =
      extractField(
        clause.content,
        'Related Standards/Relationships',
        fields.filter(
          f =>
            f !==
            'Related Standards/Relationships'
        )
      );

    // ----------------------------------------------
    // Source
    // ----------------------------------------------

    const sourceText =
      extractField(
        clause.content,
        'Source',
        fields.filter(
          f => f !== 'Source'
        )
      );

    // ----------------------------------------------
    // Convert text into arrays
    // ----------------------------------------------

    const keywords =
      keywordText
        .split(/[,;|]/)
        .map(x => x.trim())
        .filter(Boolean);

    const technicalRequirements =
      requirementText
        .split(/[,;|]/)
        .map(x => x.trim())
        .filter(Boolean);

    const relatedStandards =
      relationshipText
        .split(/[,;|]/)
        .map(x => x.trim())
        .filter(Boolean);

    // ----------------------------------------------
    // Create structured standard
    // ----------------------------------------------

    const standardId =
      createStandardId(
        standardNumber
      );

    console.log(
      `[PDF Parser] Standard ID: ${standardNumber} -> ${standardId}`
    );

    return {
      standardId,

      standardNumber,

      title:
        title || standardNumber,

      year,

      category,

      scope,

      description:
        explanation,

      keywords,

      technicalRequirements,

      applications: [],

      normativeReferences: [],

      alliedStandards:
        relatedStandards,

      testMethods: [],

      safetyStandards: [],

      materialStandards: [],

      installationStandards: [],

      supersedes: null,

      supersededBy: null,

      amendments: [],

      certificationIds: [],

      source: {
        sourceName: 'Bureau of Indian Standards',
        sourceType: 'official-bis-pdf',
        sourceUrl:
          sourceText || '',
        lastVerified:
          new Date()
            .toISOString()
            .split('T')[0]
      }
    };
  });
}

// ==================================================
// Raw PDF text extraction with pdf-parse and pdfjs fallback
// ==================================================

export async function extractRawPdfText(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF buffer is empty');
  }

  let parser: PDFParse | null = null;

  try {
    parser = new PDFParse({
      data: buffer,
      CanvasFactory,
    });

    const result = await parser.getText();

    const text = result.text ? result.text.trim() : '';
    const pageCount = result.total || 1;

    return {
      text,
      pageCount,
    };
  } catch (err: any) {
    console.error(
      '[PDF Parser] pdf-parse failed:',
      err?.message || err
    );
    throw err;
  } finally {
    // Release parser resources even when extraction fails.
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError: any) {
        console.warn(
          '[PDF Parser] Failed to destroy parser:',
          destroyError?.message || destroyError
        );
      }
    }
  }
}

// ==================================================
// Clean extracted Tender PDF text
// ==================================================

export function cleanExtractedTenderText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // Form feed and page separation
    .replace(/\f/g, '\n')
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Strip page number artifacts: e.g. "Page 1 of 5", "-- Page 3 --", "- 4 -", "[Page 2]"
    .replace(/(?:--+|\*{2,}|\[)?\s*Page\s+\d+(?:\s*(?:of|\/)\s*\d+)?\s*(?:--+|\*{2,}|\])?/gi, ' ')
    .replace(/^\s*[-—]\s*\d+\s*[-—]\s*$/gm, ' ')
    // Strip common repetitive headers & footers
    .replace(/(?:TENDER\s+DOCUMENT|TECHNICAL\s+SPECIFICATIONS?|BID\s+DOCUMENT)\s*[-:]?\s*SECTION\s*[-A-Z0-9]*/gi, ' ')
    .replace(/(?:Government\s+of\s+India|Public\s+Works\s+Department|CPWD|GeM\s+Portal\s+Tender)\s*[-:]?\s*(?:Tender\s+No\.?|Notice|Bid\s+Ref)?:?\s*[\w\d\/-]*/gi, ' ')
    // Strip non-printable / control characters (except newline, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Collapse repetitive whitespaces
    .replace(/[ \t]+/g, ' ')
    // Collapse excessive consecutive blank lines into at most 2
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// ==================================================
// TENDER PDF PIPELINE (User Input Mode 2)
// ==================================================

export async function extractAndCleanTenderPdfText(
  buffer: Buffer,
  filename: string
): Promise<{ text: string; pageCount: number; filename: string; fileSizeBytes: number }> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Tender PDF file buffer is empty');
  }

  const { text: rawText, pageCount } = await extractRawPdfText(buffer);
  const cleanedText = cleanExtractedTenderText(rawText);

  console.log(`[Tender PDF Pipeline] Extracted & cleaned ${cleanedText.length} characters across ${pageCount} pages for: ${filename}`);

  return {
    text: cleanedText,
    pageCount,
    filename,
    fileSizeBytes: buffer.length,
  };
}

// ==================================================
// BIS STANDARD PDF PIPELINE (Knowledge Base Ingestion)
// ==================================================

export async function parseBisStandardPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedStandard[]> {
  const { text } = await extractRawPdfText(buffer);
  const clauses = extractClausesFromText(text);
  const parsedStandards = parseStructuredStandards(clauses);
  console.log(`[BIS Standard PDF Pipeline] Parsed ${parsedStandards.length} structured standards from: ${filename}`);
  return parsedStandards;
}

// ==================================================
// Backward-compatible parseTenderPdf
// ==================================================

export async function parseTenderPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedTenderPdfResult> {
  const { text, pageCount, fileSizeBytes } = await extractAndCleanTenderPdfText(buffer, filename);

  const clauses = extractClausesFromText(text);
  const extractedKeyValues = clauses.map((c) => ({
    key: c.title,
    value: c.content,
  }));

  const parsedStandards = parseStructuredStandards(clauses);
  const detectedCategory = detectCategoryFromText(text);

  const firstLines = text
    .split('\n')
    .slice(0, 5)
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const suggestedTitle =
    firstLines.length > 0
      ? firstLines[0].substring(0, 90)
      : filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  return {
    filename,
    fileSizeBytes,
    pageCount,
    extractedText: text,
    extractedClauses: clauses,
    extractedKeyValues,
    parsedStandards,
    suggestedTitle,
    detectedCategory,
  };
}

// ==================================================
// Create sample PDF
// ==================================================

export function createSamplePdfBuffer(
  title: string,
  text: string
): Buffer {

  const sanitizedTitle =
    title.replace(
      /[()\\]/g,
      ''
    );

  const sanitizedText =
    text.replace(
      /[()\\]/g,
      ''
    );

  const chunk1 =
    sanitizedText.slice(0, 80);

  const chunk2 =
    sanitizedText.slice(80, 160);

  const chunk3 =
    sanitizedText.slice(160, 240);

  const chunk4 =
    sanitizedText.slice(240, 320);

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

  const streamLength =
    Buffer.byteLength(
      streamContent,
      'utf-8'
    );

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

  return Buffer.from(
    pdfString,
    'utf-8'
  );
}