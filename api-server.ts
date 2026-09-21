import 'dotenv/config';
console.log(
  'Pinecone key loaded:',
  !!process.env.PINECONE_API_KEY
);

console.log(
  'Pinecone index:',
  process.env.PINECONE_INDEX
);
import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';

import { retrievalEngine } from './server/retrievalEngine';
import { loadSampleTenders } from './server/dataStore';
import { RecommendationResponse } from './src/types';
import { parseTenderPdf, extractAndCleanTenderPdfText, createSamplePdfBuffer } from './server/pdfService';
import { getEmbedding, normalizeVector } from './server/embeddings';
import { getMongoStatus, persistRecommendation, persistReviewDecision, persistTenderDocument } from './server/mongoClient';
import { getPineconeStatus, queryPineconeVector, upsertStandardsToPinecone } from './server/pineconeClient';
import { indexPdfFolder, whereToPlacePdfs } from './server/pdfIndexer';

const recommendationsStore = new Map<string, RecommendationResponse>();
const reviewDecisions = new Map<string, { approvedIds: string[]; rejectedIds: string[]; timestamp: string }>();

const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  storage: multer.memoryStorage(),
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.post('/api/test/pinecone-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const results = await queryPineconeVector(query, 5);

    res.json({
      success: true,
      query,
      results,
    });

  } catch (err: any) {
    console.error('[Test Pinecone Search Error]', err);

    res.status(500).json({
      success: false,
      error: err?.message || String(err),
    });
  }
});


// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AI Procurement Standards Assistant API',
    version: '1.0.0-prototype',
    mode: 'Offline Grounded Prototype (Anti-Hallucination Active)',
    standardsCount: retrievalEngine.getStandards().length,
    certificationsCount: retrievalEngine.getCertifications().length,
    relationshipsCount: retrievalEngine.getRelationships().length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Dashboard Statistics
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const standards = retrievalEngine.getStandards();
  const certs = retrievalEngine.getCertifications();
  const rels = retrievalEngine.getRelationships();

  const categories = Array.from(new Set(standards.map(s => s.category)));
  const standardsWithAmendments = standards.filter(s => s.amendments && s.amendments.length > 0).length;

  // Run quick benchmark evaluation for dynamic average confidence
  const evalResult = retrievalEngine.runEvaluation();

  res.json({
    totalStandards: standards.length,
    totalCertifications: certs.length,
    totalRelationships: rels.length,
    supportedCategoriesCount: categories.length,
    standardsWithAmendments,
    averageRecommendationConfidence: Math.round(evalResult.hitAt1 * 100),
    hitAt1Percentage: Math.round(evalResult.hitAt1 * 100),
    hitAt3Percentage: Math.round(evalResult.hitAt3 * 100),
    mrrAt5: evalResult.mrrAt5,
    avgLatencyMs: evalResult.avgLatencyMs,
    categories,
  });
});

// 3. Dashboard Categories
app.get('/api/dashboard/categories', (req: Request, res: Response) => {
  const standards = retrievalEngine.getStandards();
  const catMap = new Map<string, { name: string; count: number; sampleStandards: string[] }>();

  for (const std of standards) {
    if (!catMap.has(std.category)) {
      catMap.set(std.category, { name: std.category, count: 0, sampleStandards: [] });
    }
    const entry = catMap.get(std.category)!;
    entry.count++;
    if (entry.sampleStandards.length < 2) {
      entry.sampleStandards.push(std.standardNumber);
    }
  }

  res.json(Array.from(catMap.values()));
});

// 4. Standards Directory & Search
app.get('/api/standards', (req: Request, res: Response) => {
  const { category, status } = req.query;
  let list = retrievalEngine.getStandards();

  if (category && typeof category === 'string' && category !== 'All') {
    list = list.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }
  if (status && typeof status === 'string' && status !== 'All') {
    list = list.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }

  res.json(list);
});

app.get('/api/standards/search', (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  if (!q) {
    return res.json(retrievalEngine.getStandards());
  }

  const filtered = retrievalEngine.getStandards().filter(s => {
    return (
      s.standardNumber.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.scope.toLowerCase().includes(q) ||
      s.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  res.json(filtered);
});

app.get('/api/standards/:id', (req: Request, res: Response) => {
  const std = retrievalEngine.getStandardById(req.params.id);
  if (!std) {
    return res.status(404).json({ error: 'Standard not found in prototype knowledge base' });
  }
  res.json(std);
});

// 5. Certifications Catalog
app.get('/api/certifications', (req: Request, res: Response) => {
  res.json(retrievalEngine.getCertifications());
});

app.get('/api/certifications/:id', (req: Request, res: Response) => {
  const cert = retrievalEngine.getCertificationById(req.params.id);
  if (!cert) {
    return res.status(404).json({ error: 'Certification scheme not found' });
  }
  res.json(cert);
});

// 6. Knowledge Graph
app.get('/api/graph', (req: Request, res: Response) => {
  res.json(retrievalEngine.getGraphData());
});

app.get('/api/graph/:standardId', (req: Request, res: Response) => {
  const { standardId } = req.params;
  const std = retrievalEngine.getStandardById(standardId);
  if (!std) {
    return res.status(404).json({ error: 'Standard not found' });
  }

  const allRels = retrievalEngine.getRelationships();
  const connectedEdges = allRels.filter(
    r => r.sourceStandardId === standardId || r.targetStandardId === standardId
  );

  const connectedNodeIds = new Set<string>([standardId]);
  for (const edge of connectedEdges) {
    connectedNodeIds.add(edge.sourceStandardId);
    connectedNodeIds.add(edge.targetStandardId);
  }

  const allStds = retrievalEngine.getStandards();
  const nodes = allStds
    .filter(s => connectedNodeIds.has(s.standardId))
    .map(s => ({
      id: s.standardId,
      label: s.standardNumber,
      title: s.title,
      category: s.category,
      year: s.year,
      status: s.status,
    }));

  res.json({ nodes, links: connectedEdges });
});

// 7. Sample Tenders
app.get('/api/tenders/samples', (req: Request, res: Response) => {
  res.json(loadSampleTenders());
});

// 8. Integrations & Architecture Status
app.get('/api/system/integrations', (req: Request, res: Response) => {
  res.json({
    mongodb: getMongoStatus(),
    pinecone: getPineconeStatus(),
    pdfParser: {
      active: true,
      engine: 'pdf-parse (Server & Client Extraction)',
      supportedFormats: ['PDF (.pdf)'],
      maxFileSizeMb: 25,
      features: [
        'Full-text extraction from procurement tenders',
        'Automated Technical Specification clause isolation',
        'Domain & Category auto-classification (Lighting, Safety, Cables, Pipes, etc.)',
        'Document metadata and page structure indexing',
      ],
    },
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-2.5-flash',
      mode: 'Server-side Grounded Verification & Natural Language Standards Synthesis',
    },
  });
});

// 9. PDF Tender Upload & Extraction (Multipart Form Data)
app.post('/api/tenders/upload-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file received. Please provide a valid .pdf document.' });
    }

    const filename = req.file.originalname || 'tender_specification.pdf';
    const parsed = await parseTenderPdf(req.file.buffer, filename);

    // Asynchronously log to MongoDB if connected
    persistTenderDocument({
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      filename: parsed.filename,
      fileSizeBytes: parsed.fileSizeBytes,
      extractedText: parsed.extractedText,
      uploadedAt: new Date().toISOString(),
      pageCount: parsed.pageCount,
    }).catch(err => console.error('[MongoDB Error] PDF persistence:', err));

    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('[PDF Error] Upload extraction failed:', err);
    res.status(500).json({ error: err.message || 'Failed to process and parse tender PDF file.' });
  }
});

// 10. PDF Tender Extraction (Base64 JSON for drag-and-drop or client FileReader)
app.post('/api/tenders/parse-pdf-base64', async (req: Request, res: Response) => {
  try {
    const { base64, filename } = req.body;
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'Base64 encoded PDF payload is required.' });
    }

    const cleanBase64 = base64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const parsed = await parseTenderPdf(buffer, filename || 'tender_document.pdf');

    // Asynchronously log to MongoDB if connected
    persistTenderDocument({
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      filename: parsed.filename,
      fileSizeBytes: parsed.fileSizeBytes,
      extractedText: parsed.extractedText,
      uploadedAt: new Date().toISOString(),
      pageCount: parsed.pageCount,
    }).catch(err => console.error('[MongoDB Error] PDF base64 persistence:', err));

    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('[PDF Error] Base64 extraction failed:', err);
    res.status(500).json({ error: err.message || 'Failed to process tender PDF.' });
  }
});

// 11. Test Sample Tender PDF Extraction (Generates valid PDF and parses it using pdf-parse)
app.get('/api/tenders/test-sample-pdf/:id', async (req: Request, res: Response) => {
  try {
    const samples = loadSampleTenders();
    const sample = samples.find(s => s.id === req.params.id) || samples[0];
    if (!sample) {
      return res.status(404).json({ error: 'Sample tender not found' });
    }

    const pdfBuffer = createSamplePdfBuffer(sample.title, sample.text);
    const parsed = await parseTenderPdf(pdfBuffer, `${sample.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_spec.pdf`);

    res.json({ success: true, sampleId: sample.id, ...parsed });
  } catch (err: any) {
    console.error('[PDF Error] Sample test failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate and parse sample PDF' });
  }
});

// 12. Pinecone Vector Sync Endpoint
app.post('/api/system/pinecone/sync', async (req: Request, res: Response) => {
  const standards = retrievalEngine.getStandards();
  const result = await upsertStandardsToPinecone(standards);
  res.json({
    status: result.success ? 'synced' : 'embedded_fallback',
    recordsSynced: result.count,
    pineconeStatus: getPineconeStatus(),
  });
});

// 12b. Index PDFs from disk into Pinecone
app.post('/api/system/pinecone/index-pdfs', async (req: Request, res: Response) => {
  const folder = (req.body && req.body.folder) || undefined;
  const result = await indexPdfFolder(folder);
  res.json({ success: result.success, indexedFiles: result.indexedFiles, recordsIndexed: result.recordsIndexed, errors: result.errors });
});

// 12. Recommendation Analyze with Pinecone Query + MongoDB Persistence (Mode 1 - Text)
app.post('/api/recommendations/analyze', async (req: Request, res: Response) => {
  const { specificationText } = req.body;
  if (!specificationText || typeof specificationText !== 'string' || specificationText.trim().length === 0) {
    return res.status(400).json({ error: 'Specification text is required' });
  }

  // 1. Extract requirements
  const extractedRequirements = retrievalEngine.extractRequirements(specificationText);

  // 2. Build semantic representation of the extracted requirements
  const semanticQuery = [
    extractedRequirements.product,
    extractedRequirements.category,
    extractedRequirements.application,
    extractedRequirements.environment,
    ...extractedRequirements.requirements,
    specificationText.slice(0, 500),
  ].join(' ');

  // 3. SentenceTransformers 384D embedding + Pinecone query
  let pineconeMatches = null;
  let queryEmbedding: number[] | null = null;
  try {
    queryEmbedding = await getEmbedding(semanticQuery);
    if (queryEmbedding) {
      queryEmbedding = normalizeVector(queryEmbedding);
    }
    pineconeMatches = await queryPineconeVector(semanticQuery, 5);
  } catch (err) {
    console.warn('[Pinecone Query Warning] Falling back to local SentenceTransformers:', err);
  }

  const result = await retrievalEngine.analyzeSpecificationAsync(
    specificationText,
    pineconeMatches,
    queryEmbedding,
    extractedRequirements,
    'text'
  );

  recommendationsStore.set(result.recommendationId, result);
  reviewDecisions.set(result.recommendationId, { approvedIds: [], rejectedIds: [], timestamp: new Date().toISOString() });

  // Persist to MongoDB if connected
  persistRecommendation(result).catch(err => console.error('[MongoDB Error] Persist recommendation:', err));

  res.json(result);
});

// 12b. Recommendation Analyze Tender PDF (Mode 2 - PDF Upload)
app.post('/api/recommendations/analyze-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file received. Please provide a valid .pdf document.' });
    }

    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return res.status(400).json({ error: 'Invalid file format. Only PDF documents are supported.' });
    }

    const filename = req.file.originalname || 'tender_specification.pdf';
    const { text, pageCount, fileSizeBytes } = await extractAndCleanTenderPdfText(req.file.buffer, filename);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Unable to extract text from the provided PDF file.' });
    }

    // 1. Extract requirements
    const extractedRequirements = retrievalEngine.extractRequirements(text);

    // 2. Build semantic query from structured requirements & text
    const semanticQuery = [
      extractedRequirements.product,
      extractedRequirements.category,
      extractedRequirements.application,
      extractedRequirements.environment,
      ...extractedRequirements.requirements,
      text.slice(0, 500),
    ].join(' ');

    // 3. SentenceTransformers 384D embedding + Pinecone query
    let pineconeMatches = null;
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await getEmbedding(semanticQuery);
      if (queryEmbedding) {
        queryEmbedding = normalizeVector(queryEmbedding);
      }
      pineconeMatches = await queryPineconeVector(semanticQuery, 5);
    } catch (err) {
      console.warn('[Pinecone Query Warning] Falling back to local SentenceTransformers:', err);
    }

    // 4. Recommendation analysis with multi-factor reranking & grounding
    const result = await retrievalEngine.analyzeSpecificationAsync(
      text,
      pineconeMatches,
      queryEmbedding,
      extractedRequirements,
      'pdf',
      filename
    );

    recommendationsStore.set(result.recommendationId, result);
    reviewDecisions.set(result.recommendationId, { approvedIds: [], rejectedIds: [], timestamp: new Date().toISOString() });

    // Persist to MongoDB if connected
    persistRecommendation(result).catch(err => console.error('[MongoDB Error] Persist PDF recommendation:', err));
    persistTenderDocument({
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      filename,
      fileSizeBytes,
      extractedText: text,
      uploadedAt: new Date().toISOString(),
      pageCount,
    }).catch(err => console.error('[MongoDB Error] PDF persistence:', err));

    res.json(result);
  } catch (err: any) {
    console.error('[Analyze PDF Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze tender PDF.' });
  }
});

app.get('/api/recommendations/latest', (req: Request, res: Response) => {
  // Return the most recently stored recommendation, or null
  const keys = Array.from(recommendationsStore.keys());
  if (keys.length === 0) {
    return res.json({ recommendation: null });
  }
  const lastId = keys[keys.length - 1];
  const rec = recommendationsStore.get(lastId);
  const review = reviewDecisions.get(lastId);
  res.json({ recommendation: rec, review });
});

app.get('/api/recommendations/:id', (req: Request, res: Response) => {
  const rec = recommendationsStore.get(req.params.id);
  if (!rec) {
    // If not in in-memory store, check if we have review decisions or return empty
    const review = reviewDecisions.get(req.params.id);
    return res.json({ recommendation: null, review: review || null });
  }
  const review = reviewDecisions.get(req.params.id);
  res.json({ recommendation: rec, review });
});

// Approve a standard (or toggle to pending if already approved and toggle is requested)
app.post('/api/recommendations/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { standardId, toggle } = req.body;
  const rec = recommendationsStore.get(id);

  let review = reviewDecisions.get(id);
  if (!review) {
    review = { approvedIds: [], rejectedIds: [], timestamp: new Date().toISOString() };
    reviewDecisions.set(id, review);
  }

  let newStatus: 'approved' | 'pending' = 'approved';
  if (toggle && review.approvedIds.includes(standardId)) {
    // Toggle back to pending
    review.approvedIds = review.approvedIds.filter(x => x !== standardId);
    newStatus = 'pending';
  } else {
    if (!review.approvedIds.includes(standardId)) {
      review.approvedIds.push(standardId);
    }
    review.rejectedIds = review.rejectedIds.filter(x => x !== standardId);
  }

  // Update in recommendation record if available in memory
  if (rec) {
    for (const p of rec.primaryRecommendations) {
      if (p.standardId.toLowerCase() === standardId.toLowerCase()) p.reviewStatus = newStatus;
    }
    for (const r of rec.relatedStandards) {
      if (r.standardId.toLowerCase() === standardId.toLowerCase()) r.reviewStatus = newStatus;
    }
  }

  // Persist review to MongoDB if connected
  persistReviewDecision(id, review).catch(err => console.error('[MongoDB Error] Persist review approval:', err));

  res.json({ success: true, status: newStatus, standardId, review });
});

// Reject a standard (or toggle to pending if already rejected and toggle is requested)
app.post('/api/recommendations/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { standardId, toggle } = req.body;
  const rec = recommendationsStore.get(id);

  let review = reviewDecisions.get(id);
  if (!review) {
    review = { approvedIds: [], rejectedIds: [], timestamp: new Date().toISOString() };
    reviewDecisions.set(id, review);
  }

  let newStatus: 'rejected' | 'pending' = 'rejected';
  const stdLower = standardId.toLowerCase();
  const isCurrentlyRejected = review.rejectedIds.some(x => x.toLowerCase() === stdLower);

  if (toggle && isCurrentlyRejected) {
    // Toggle back to pending
    review.rejectedIds = review.rejectedIds.filter(x => x.toLowerCase() !== stdLower);
    newStatus = 'pending';
  } else {
    if (!isCurrentlyRejected) {
      review.rejectedIds.push(standardId);
    }
    review.approvedIds = review.approvedIds.filter(x => x.toLowerCase() !== stdLower);
  }

  // Update in recommendation record if available in memory
  if (rec) {
    for (const p of rec.primaryRecommendations) {
      if (p.standardId.toLowerCase() === stdLower) p.reviewStatus = newStatus;
    }
    for (const r of rec.relatedStandards) {
      if (r.standardId.toLowerCase() === stdLower) r.reviewStatus = newStatus;
    }
  }

  // Persist review to MongoDB if connected
  persistReviewDecision(id, review).catch(err => console.error('[MongoDB Error] Persist review rejection:', err));

  res.json({ success: true, status: newStatus, standardId, review });
});

// Reset standard to pending
app.post('/api/recommendations/:id/reset', (req: Request, res: Response) => {
  const { id } = req.params;
  const { standardId } = req.body;
  const rec = recommendationsStore.get(id);
  const stdLower = standardId.toLowerCase();

  let review = reviewDecisions.get(id);
  if (!review) {
    review = { approvedIds: [], rejectedIds: [], timestamp: new Date().toISOString() };
    reviewDecisions.set(id, review);
  }

  review.approvedIds = review.approvedIds.filter(x => x.toLowerCase() !== stdLower);
  review.rejectedIds = review.rejectedIds.filter(x => x.toLowerCase() !== stdLower);

  if (rec) {
    for (const p of rec.primaryRecommendations) {
      if (p.standardId.toLowerCase() === stdLower) p.reviewStatus = 'pending';
    }
    for (const r of rec.relatedStandards) {
      if (r.standardId.toLowerCase() === stdLower) r.reviewStatus = 'pending';
    }
  }

  res.json({ success: true, status: 'pending', standardId, review });
});

// Approve all standards in this recommendation
app.post('/api/recommendations/:id/approve-all', (req: Request, res: Response) => {
  const { id } = req.params;
  const rec = recommendationsStore.get(id);
  const allIds: string[] = [];

  if (rec) {
    for (const p of rec.primaryRecommendations) {
      p.reviewStatus = 'approved';
      allIds.push(p.standardId);
    }
    for (const r of rec.relatedStandards) {
      r.reviewStatus = 'approved';
      allIds.push(r.standardId);
    }
  }

  const review = {
    approvedIds: Array.from(new Set(allIds)),
    rejectedIds: [],
    timestamp: new Date().toISOString(),
  };
  reviewDecisions.set(id, review);

  persistReviewDecision(id, review).catch(err => console.error('[MongoDB Error] Persist bulk approval:', err));
  res.json({ success: true, review });
});

// Reset all review decisions in this recommendation back to pending
app.post('/api/recommendations/:id/reset-all', (req: Request, res: Response) => {
  const { id } = req.params;
  const rec = recommendationsStore.get(id);

  if (rec) {
    for (const p of rec.primaryRecommendations) {
      p.reviewStatus = 'pending';
    }
    for (const r of rec.relatedStandards) {
      r.reviewStatus = 'pending';
    }
  }

  const review = {
    approvedIds: [],
    rejectedIds: [],
    timestamp: new Date().toISOString(),
  };
  reviewDecisions.set(id, review);

  persistReviewDecision(id, review).catch(err => console.error('[MongoDB Error] Persist bulk reset:', err));
  res.json({ success: true, review });
});

// 9. Evaluation Endpoint
app.get('/api/evaluation/run', (req: Request, res: Response) => {
  const evalResult = retrievalEngine.runEvaluation();
  res.json(evalResult);
});

// Vite Middleware Setup (Local Dev & Standard Build)
async function setupServer() {
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const viteModule = await import('vite');
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (!req.originalUrl.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  if (process.env.VERCEL !== '1') {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`AI Procurement Standards Assistant running on http://0.0.0.0:${PORT}`);
    });
  }
}

setupServer();

export default app;
