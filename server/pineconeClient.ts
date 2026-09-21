import { Pinecone } from '@pinecone-database/pinecone';
import { Standard } from '../src/types';
import { getEmbedding, normalizeVector } from './embeddings';

let pineconeClient: Pinecone | null = null;
let isConnected = false;
let connectionError: string | null = null;

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'bis-procurement-standards';

export function getPineconeClient(): Pinecone | null {
  if (pineconeClient && isConnected) {
    return pineconeClient;
  }

  if (!PINECONE_API_KEY) {
    connectionError = 'PINECONE_API_KEY is not set in environment. Operating in embedded cosine similarity vector mode.';
    return null;
  }

  try {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
    isConnected = true;
    connectionError = null;
    console.log('[Pinecone] Pinecone client initialized successfully');
    return pineconeClient;
  } catch (err: any) {
    isConnected = false;
    connectionError = err?.message || 'Failed to initialize Pinecone client';
    console.warn(`[Pinecone Warning] Failed to initialize Pinecone: ${connectionError}. Using embedded fallback.`);
    return null;
  }
}

export function getPineconeStatus() {
  return {
    configured: Boolean(PINECONE_API_KEY),
    connected: isConnected,
    indexName: PINECONE_INDEX,
    error: connectionError,
    mode: isConnected ? 'Pinecone Cloud Vector DB' : 'Embedded Hybrid Vector Engine (Fallback)',
  };
}

/**
 * Generates a pseudo-embedding vector of 128 dimensions from text for testing or lightweight hybrid vector search,
 * or allows bridging with Gemini Embedding models when available.
 */
export function generateHashEmbedding(text: string, dimensions = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1 / (1 + Math.log(1 + i));
  }

  // Normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}

/**
 * Queries Pinecone index if configured; otherwise returns null so caller falls back to local engine.
 */
export async function queryPineconeVector(
  queryText: string,
  topK = 5
): Promise<Array<{ id: string; score: number }> | null> {

  const pc = getPineconeClient();

  if (!pc) {
    return null;
  }

  try {
    const index = pc.index(PINECONE_INDEX);

    console.log('[Pinecone Query] Query:', queryText);

    // Generate the SAME 384-dimensional embedding
    // that was used while indexing the PDF.
    let queryVector = await getEmbedding(queryText);

if (!queryVector) {
  throw new Error('Failed to generate 384-dimensional embedding');
}

queryVector = normalizeVector(queryVector);

    console.log(
      '[Pinecone Query] Vector dimension:',
      queryVector.length
    );

    const response = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });

    const rawMatches = response.matches || [];

    console.log(
      '[Pinecone Query] Raw matches:',
      rawMatches.length
    );

    if (rawMatches.length === 0) {
      console.log('[Pinecone Query] No matches found');
      return [];
    }

    /*
      Convert Pinecone matches into our format.
    */
   const matches = rawMatches.map((m: any) => {

  const score =
    typeof m.score === 'number'
      ? m.score
      : 0;

  const metadata = m.metadata || {};

  const parentId =
    metadata.standardNumber ||
    metadata.standardId ||
    m.id;

  console.log(
    '[Pinecone Query] Match:',
    parentId,
    'Score:',
    score
  );

  return {
    id: parentId,
    score,
  };
});

    /*
      If multiple chunks belong to the same standard,
      keep only the highest score for that standard.
    */
    const aggregated = new Map<string, number>();

    for (const match of matches) {

      const previousScore =
        aggregated.get(match.id) || 0;

      aggregated.set(
        match.id,
        Math.max(previousScore, match.score)
      );
    }

    const results = Array.from(
      aggregated.entries()
    )
      .map(([id, score]) => ({
        id,
        score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(
      '[Pinecone Query] Final results:',
      results
    );

    return results;

  } catch (err) {

    console.error(
      '[Pinecone Error] Query failed:',
      err
    );

    return null;
  }
}
/**
 * Upserts standard documents into Pinecone index if configured.
 */
export async function upsertStandardsToPinecone(standards: Standard[]): Promise<{ success: boolean; count: number }> {
  const pc = getPineconeClient();
  if (!pc) return { success: false, count: 0 };

  try {
    const index = pc.index(PINECONE_INDEX);
    // Chunk large standard documents into smaller text chunks for RAG
    const records: Array<{ id: string; values: number[]; metadata: any }> = [];
    for (const std of standards) {
      const fullText = [
        std.standardNumber,
        std.title,
        std.scope,
        std.description || '',
        ...(std.keywords || []),
        ...(std.technicalRequirements || []),
      ].join(' ');

      const words = fullText.split(/\s+/).filter(Boolean);
      const chunkSize = 120; // words
      const overlap = 20;
      let idx = 0;
      let chunkIndex = 0;
      while (idx < words.length) {
        const chunkWords = words.slice(idx, idx + chunkSize);
        const chunkText = chunkWords.join(' ');
        // attempt real embedding first
        let vec = await getEmbedding(chunkText);

if (!vec) {
  throw new Error(`Failed to generate embedding for ${std.standardNumber}`);
}

vec = normalizeVector(vec);
        records.push({
          id: `${std.standardId}::${chunkIndex}`,
          values: vec,
          metadata: {
            parentStandardId: std.standardId,
            standardNumber: std.standardNumber,
            title: std.title,
            category: std.category,
            year: std.year,
            chunkIndex,
            textSnippet: chunkText.slice(0, 500),
          },
        });

        chunkIndex++;
        idx += chunkSize - overlap;
      }
    }

    // Upsert in batches of 50
    // Upsert in batches of 50
    for (let i = 0; i < records.length; i += 50) {
  const batch = records.slice(i, i + 50).map(r => ({
    id: r.id,
    values: r.values,
    metadata: r.metadata
  }));

  await (index as any).upsert({
    records: batch
  });
}

    return { success: true, count: records.length };
  } catch (err) {
    console.error('[Pinecone Error] Upsert failed:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Generic upsert for pre-built records (id, values, metadata)
 */

export async function upsertRecordsToPinecone(
  records: Array<{
    id: string;
    values: number[];
    metadata?: any;
  }>
): Promise<{ success: boolean; count: number }> {

  console.log('[Pinecone] Records received:', records.length);

  if (records.length === 0) {
    console.error('[Pinecone] No records to upsert');
    return { success: false, count: 0 };
  }

  console.log('[Pinecone] First record ID:', records[0].id);
  console.log(
    '[Pinecone] First vector dimension:',
    records[0].values.length
  );

  const pc = getPineconeClient();

  if (!pc) {
    return { success: false, count: 0 };
  }

  try {
    const index = pc.index(PINECONE_INDEX);

    for (let i = 0; i < records.length; i += 50) {

      const batch = records
        .slice(i, i + 50)
        .map(r => ({
          id: r.id,
          values: r.values,
          metadata: r.metadata || {},
        }));

      console.log('[Pinecone] Batch size:', batch.length);

      if (batch.length === 0) {
        continue;
      }

      await (index as any).upsert({
  records: batch
});
    }

    console.log(
      '[Pinecone] Successfully upserted:',
      records.length
    );

    return {
      success: true,
      count: records.length,
    };

  } catch (err) {
    console.error('[Pinecone Error] Generic upsert failed:', err);

    return {
      success: false,
      count: 0,
    };
  }
}