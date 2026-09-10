import { Pinecone } from '@pinecone-database/pinecone';
import { Standard } from '../src/types';

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
  if (!pc) return null;

  try {
    const index = pc.index(PINECONE_INDEX);
    const queryVector = generateHashEmbedding(queryText);
    const response = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });

    return (response.matches || []).map(m => ({
      id: m.id,
      score: m.score || 0,
    }));
  } catch (err) {
    console.warn('[Pinecone Error] Query failed, defaulting to local retrieval engine:', err);
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
    const records = standards.map(std => {
      const fullText = `${std.standardNumber} ${std.title} ${std.scope} ${std.keywords.join(' ')}`;
      return {
        id: std.standardId,
        values: generateHashEmbedding(fullText),
        metadata: {
          standardNumber: std.standardNumber,
          title: std.title,
          category: std.category,
          year: std.year,
        },
      };
    });

    // Upsert in batches of 50
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      await (index as any).upsert(batch);
    }

    return { success: true, count: records.length };
  } catch (err) {
    console.error('[Pinecone Error] Upsert failed:', err);
    return { success: false, count: 0 };
  }
}
