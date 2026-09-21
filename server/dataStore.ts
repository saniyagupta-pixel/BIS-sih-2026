import fs from 'fs';
import path from 'path';
import { Standard, Certification, Relationship, SampleTender, EvaluationQuery } from '../src/types';

let dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  dataDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    dataDir = path.resolve(__dirname, '../data');
  }
}

import { ParsedStandard } from './pdfService';

let parsedPdfStandards: ParsedStandard[] = [];

export function setParsedPdfStandards(
  standards: ParsedStandard[]
): void {
  parsedPdfStandards = standards;
  console.log(
    `[DataStore] Loaded ${parsedPdfStandards.length} PDF-derived standards`
  );
}

export function convertParsedStandardToStandard(
  parsed: ParsedStandard
): Standard {
  return {
    standardId: parsed.standardId,
    standardNumber: parsed.standardNumber,
    title: parsed.title,
    year: parsed.year,

    status: 'Current',

    category: parsed.category,
    scope: parsed.scope,
    description: parsed.description,

    keywords: parsed.keywords,
    technicalRequirements: parsed.technicalRequirements,

    productCategories: [],
    applications: parsed.applications,

    normativeReferences: parsed.normativeReferences,
    alliedStandards: parsed.alliedStandards,
    testMethods: parsed.testMethods,
    safetyStandards: parsed.safetyStandards,
    materialStandards: parsed.materialStandards,
    installationStandards: parsed.installationStandards,

    supersedes: parsed.supersedes,
    supersededBy: parsed.supersededBy,

    amendments: parsed.amendments,
    certificationIds: parsed.certificationIds,

    source: parsed.source
  };
}

export function getParsedPdfStandards(): ParsedStandard[] {
  return parsedPdfStandards;
}

export function getAllStandards(): Standard[] {
  const staticStandards = loadStandards();

  const pdfStandards = parsedPdfStandards.map(
    convertParsedStandardToStandard
  );

  return [
    ...staticStandards,
    ...pdfStandards
  ];
}
export function loadStandards(): Standard[] {
  const filePath = path.join(dataDir, 'standards', 'standards.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

export function loadCertifications(): Certification[] {
  const filePath = path.join(dataDir, 'certifications', 'certifications.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

export function loadRelationships(): Relationship[] {
  const filePath = path.join(dataDir, 'relationships', 'relationships.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

export function loadSampleTenders(): SampleTender[] {
  const filePath = path.join(dataDir, 'sample-tenders', 'sample_tenders.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

export function loadEvaluationQueries(): EvaluationQuery[] {
  const filePath = path.join(dataDir, 'evaluation', 'test_queries.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}
