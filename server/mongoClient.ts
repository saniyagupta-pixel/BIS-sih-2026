import { MongoClient, Db } from 'mongodb';
import { RecommendationResponse } from '../src/types';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;
let connectionError: string | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'bis_procurement_assistant';

export async function getMongoDb(): Promise<Db | null> {
  if (db && isConnected) {
    return db;
  }

  if (!MONGODB_URI) {
    connectionError = 'MONGODB_URI is not set in environment variables. Operating in resilient embedded storage mode.';
    return null;
  }

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
    }
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    connectionError = null;
    console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);
    return db;
  } catch (err: any) {
    isConnected = false;
    connectionError = err?.message || 'Failed to connect to MongoDB cluster';
    console.warn(`[MongoDB Warning] Could not connect to MongoDB: ${connectionError}. Using embedded fallback.`);
    return null;
  }
}

export function getMongoStatus() {
  return {
    configured: Boolean(MONGODB_URI),
    connected: isConnected,
    database: isConnected ? DB_NAME : null,
    error: connectionError,
    mode: isConnected ? 'Live MongoDB Cluster' : 'Resilient Embedded Store (Fallback)',
  };
}

export async function persistRecommendation(recommendation: RecommendationResponse): Promise<boolean> {
  try {
    const database = await getMongoDb();
    if (!database) return false;

    const collection = database.collection('recommendations');
    await collection.updateOne(
      { recommendationId: recommendation.recommendationId },
      { $set: { ...recommendation, updatedAt: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error('[MongoDB Error] Failed to persist recommendation:', err);
    return false;
  }
}

export async function persistReviewDecision(
  recommendationId: string,
  decision: { approvedIds: string[]; rejectedIds: string[]; timestamp: string }
): Promise<boolean> {
  try {
    const database = await getMongoDb();
    if (!database) return false;

    const collection = database.collection('review_decisions');
    await collection.updateOne(
      { recommendationId },
      { $set: { recommendationId, ...decision, updatedAt: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error('[MongoDB Error] Failed to persist review decision:', err);
    return false;
  }
}

export async function persistTenderDocument(doc: {
  id: string;
  filename: string;
  fileSizeBytes: number;
  extractedText: string;
  uploadedAt: string;
  pageCount?: number;
}): Promise<boolean> {
  try {
    const database = await getMongoDb();
    if (!database) return false;

    const collection = database.collection('tender_documents');
    await collection.insertOne({ ...doc, createdAt: new Date() });
    return true;
  } catch (err) {
    console.error('[MongoDB Error] Failed to persist tender document:', err);
    return false;
  }
}
