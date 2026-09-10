import fs from 'fs';
import path from 'path';
import { Standard, Certification, Relationship, SampleTender, EvaluationQuery } from '../src/types';

const dataDir = path.resolve(process.cwd(), 'data');

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
