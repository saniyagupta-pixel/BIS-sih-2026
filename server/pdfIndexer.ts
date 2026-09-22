import fs from 'fs';
import path from 'path';

import { parseTenderPdf } from './pdfService.js';
import { setParsedPdfStandards } from './dataStore.js';
import { retrievalEngine } from './retrievalEngine.js';

import {
  getEmbedding,
  normalizeVector
} from './embeddings.js';

import {
  upsertRecordsToPinecone
} from './pineconeClient.js';

const DEFAULT_PDFS_DIR = path.resolve(
  process.cwd(),
  'data',
  'pdfs'
);

// --------------------------------------------------
// Extract exact BIS standard number
// --------------------------------------------------

function extractStandardNumber(
  text: string
): string | null {

  const match = text.match(
    /\bIS(?:\s*\/\s*IEC)?\s+\d+(?:\s*\([^)]*\))?(?::\s*\d{4})?/i
  );

  return match
    ? match[0].replace(/\s+/g, ' ').trim()
    : null;
}

// --------------------------------------------------
// Convert standard number into stable internal ID
// --------------------------------------------------

function standardNumberToId(
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

// --------------------------------------------------
// Result type
// --------------------------------------------------

interface IndexPdfFolderResult {
  success: boolean;
  indexedFiles: number;
  recordsIndexed: number;
  errors: string[];
}

// --------------------------------------------------
// Index all PDFs
// --------------------------------------------------

export async function indexPdfFolder(
  folderPath?: string
): Promise<IndexPdfFolderResult> {

  const dir = folderPath
    ? path.resolve(folderPath)
    : DEFAULT_PDFS_DIR;

  const result: IndexPdfFolderResult = {
    success: true,
    indexedFiles: 0,
    recordsIndexed: 0,
    errors: []
  };

  // ------------------------------------------------
  // Check folder
  // ------------------------------------------------

  if (!fs.existsSync(dir)) {

    return {
      success: false,
      indexedFiles: 0,
      recordsIndexed: 0,
      errors: [
        `PDF folder not found: ${dir}`
      ]
    };
  }

  // ------------------------------------------------
  // Find PDFs
  // ------------------------------------------------

  const files = fs
    .readdirSync(dir)
    .filter(
      f => f.toLowerCase().endsWith('.pdf')
    );

  // ------------------------------------------------
  // Process each PDF
  // ------------------------------------------------

  for (const file of files) {

    try {

      console.log(
        `\n[PDF Index] Processing: ${file}`
      );

      const buf = fs.readFileSync(
        path.join(dir, file)
      );

      // --------------------------------------------
      // Parse PDF
      // --------------------------------------------

      const parsed =
        await parseTenderPdf(buf, file);

      // --------------------------------------------
      // Load structured standards into runtime store
      // --------------------------------------------

      if (parsed.parsedStandards?.length) {

        setParsedPdfStandards(
          parsed.parsedStandards
        );

        console.log(
          `[PDF Index] Loaded ${parsed.parsedStandards.length} structured standards into runtime store`
        );

        // Refresh retrieval engine so it can see
        // the standards parsed from the PDF.
        retrievalEngine.initialize();

        console.log(
          `[PDF Index] Retrieval engine refreshed with ${retrievalEngine.getStandards().length} standards`
        );
      }

      // --------------------------------------------
      // Get extracted key/value pairs
      // --------------------------------------------

      const kvs =
        (parsed as any).extractedKeyValues ||
        parsed.extractedClauses.map(
          (c: any) => ({
            key: c.title,
            value: c.content
          })
        );

      console.log(
        '[PDF Index] extractedClauses:',
        parsed.extractedClauses?.length
      );

      console.log(
        '[PDF Index] key-value records:',
        kvs.length
      );

      // --------------------------------------------
      // Prepare Pinecone records
      // --------------------------------------------

      const records: Array<{
        id: string;
        values: number[];
        metadata: any;
      }> = [];

      let pairIndex = 0;

      // --------------------------------------------
      // Process each extracted record
      // --------------------------------------------

      for (const kv of kvs) {

        const textToEmbed =
          `${kv.key}: ${kv.value}`;

        // ------------------------------------------
        // Detect BIS standard number
        // ------------------------------------------

        const standardNumber =
          extractStandardNumber(textToEmbed) ||
          extractStandardNumber(
            parsed.suggestedTitle || ''
          );

        if (!standardNumber) {

          console.warn(
            `[PDF Index] Could not detect standard number for record ${pairIndex}:`,
            kv.key
          );

          pairIndex++;
          continue;
        }

        // ------------------------------------------
        // Generate stable ID
        // ------------------------------------------

        const standardId =
          standardNumberToId(
            standardNumber
          );

        console.log(
          `[PDF Index] Standard detected: ${standardNumber}`
        );

        // ------------------------------------------
        // Generate embedding
        // ------------------------------------------

        const vec =
          await getEmbedding(
            textToEmbed
          );

        if (!vec) {

          throw new Error(
            `Embedding failed for: ${standardNumber}`
          );
        }

        const normalizedVec =
          normalizeVector(vec);

        // ------------------------------------------
        // Validate dimension
        // ------------------------------------------

        if (normalizedVec.length !== 384) {

          throw new Error(
            `Invalid embedding dimension for ${standardNumber}: ${normalizedVec.length}`
          );
        }

        // ------------------------------------------
        // Create Pinecone record
        // ------------------------------------------

        records.push({

          id:
            `standard::${standardId}::chunk::${pairIndex}`,

          values:
            normalizedVec,

          metadata: {

            source:
              'official-bis-pdf',

            filename:
              file,

            standardId,

            standardNumber,

            kvIndex:
              pairIndex,

            key:
              kv.key,

            suggestedTitle:
              parsed.suggestedTitle,

            detectedCategory:
              parsed.detectedCategory,

            textSnippet:
              (kv.value || '')
                .slice(0, 500)
          }
        });

        pairIndex++;
      }

      // --------------------------------------------
      // Upsert into Pinecone
      // --------------------------------------------

      if (records.length > 0) {

        console.log(
          `[PDF Index] Upserting ${records.length} records`
        );

        const up =
          await upsertRecordsToPinecone(
            records
          );

        if (!up.success) {

          result.errors.push(
            `Upsert failed for ${file}`
          );

        } else {

          console.log(
            `[PDF Index] Successfully indexed ${up.count} records`
          );

          result.recordsIndexed +=
            up.count;
        }
      }

      result.indexedFiles++;

    } catch (err: any) {

      console.error(
        `[PDF Index] Error processing ${file}:`,
        err
      );

      result.errors.push(
        `${file}: ${err?.message || err}`
      );
    }
  }

  return result;
}

// --------------------------------------------------
// PDF directory
// --------------------------------------------------

export function whereToPlacePdfs(): string {
  return DEFAULT_PDFS_DIR;
}