import { pipeline } from '@xenova/transformers';

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  return extractor;
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const extractor = await getExtractor();

    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  } catch (err: any) {
    console.warn(
      '[Local Embedding] Failed:',
      err?.message || err
    );

    return null;
  }
}

export function normalizeVector(vec: number[]): number[] {
  let norm = 0;

  for (const v of vec) {
    norm += v * v;
  }

  norm = Math.sqrt(norm || 1);

  return vec.map(v => v / norm);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  // Cosine similarity in range [0, 1] for unit-normalized vectors
  const sim = dotProduct / denominator;
  return Math.max(0, Math.min(1, sim));
}