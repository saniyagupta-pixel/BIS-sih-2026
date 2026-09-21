export interface StandardSource {
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  lastVerified: string;
}

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
  source: StandardSource;
}

export interface Standard {
  standardId: string;
  standardNumber: string;
  title: string;
  year: number;
  status: 'Current' | 'Amended' | 'Under Review' | 'Superseded';
  category: string;
  scope: string;
  description: string;
  keywords: string[];
  technicalRequirements: string[];
  productCategories: string[];
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
  source: StandardSource;
}

export interface Certification {
  certificationId: string;
  name: string;
  authority: string;
  description: string;
  schemeType: string;
  applicableProducts: string[];
  applicableCategories: string[];
  applicabilityStatus: 'Applicable' | 'Potentially Applicable' | 'Verify Official Requirement' | 'Not Applicable';
  requirements: string[];
  relatedStandards: string[];
  source: {
    sourceName: string;
    sourceType: string;
    sourceUrl: string;
    lastVerified: string;
  };
  lastVerified: string;
}

export interface Relationship {
  sourceStandardId: string;
  targetStandardId: string;
  relationshipType: 'NORMATIVE_REFERENCE' | 'TEST_METHOD' | 'SAFETY_STANDARD' | 'MATERIAL_STANDARD' | 'INSTALLATION_STANDARD' | 'RELATED_TO' | 'SUPERSEDES';
  description: string;
  source: string;
}

export interface ScoreBreakdown {
  semanticScore: number;
  scopeScore: number;
  categoryScore: number;
  applicationScore: number;
  relationshipScore: number;
  finalScore: number;
}

export interface PrimaryRecommendation {
  standardId: string;
  standardNumber: string;
  title: string;
  year: number;
  status: string;
  category: string;
  scope: string;
  source: StandardSource;
  relevanceScore: number;
  whyRecommended: string;
  technicalRequirements?: string[];
  amendments?: string[];
  scoreBreakdown: ScoreBreakdown;
  reviewStatus: 'pending' | 'approved' | 'rejected';
}

export interface RelatedStandardRecommendation {
  standardId: string;
  standardNumber: string;
  title: string;
  year: number;
  status: string;
  category: string;
  relationshipType: string;
  parentStandardNumber: string;
  reason: string;
  source: StandardSource;
  reviewStatus: 'pending' | 'approved' | 'rejected';
}

export interface CertificationRecommendation {
  certificationId: string;
  name: string;
  authority: string;
  schemeType: string;
  applicability: string;
  reason: string;
  source: {
    sourceName: string;
    sourceType: string;
    sourceUrl: string;
  };
}

export interface ExtractedRequirements {
  product: string;
  productName: string; // backwards compatibility
  category: string;
  application: string;
  environment: string;
  technicalRequirements?: string[];
  safetyRequirements?: string[];
  performanceRequirements?: string[];
  testingRequirements?: string[];
  materialRequirements?: string[];
  installationRequirements?: string[];
  requirements: string[];
  keyRequirements: string[]; // backwards compatibility
}

export interface GroundingInfo {
  isGrounded: boolean;
  verifiedStandards: number;
  unverifiedStandardsFilteredOut: number;
}

export interface RecommendationResponse {
  recommendationId: string;
  timestamp: string;
  inputType?: 'text' | 'pdf';
  filename?: string;
  specificationText: string;
  summary: string;
  extractedRequirements: ExtractedRequirements;
  recommendations: PrimaryRecommendation[]; // alias for spec compliance
  primaryRecommendations: PrimaryRecommendation[];
  relatedStandards: RelatedStandardRecommendation[];
  certifications: CertificationRecommendation[];
  warnings: string[];
  grounding: GroundingInfo;
  groundingStatus: {
    isGrounded: boolean;
    unverifiedStandardsFilteredOut: number;
    hallucinationFreeVerified: boolean;
    engineMode: string;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  category: string;
  year: number;
  status: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  description: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SampleTender {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  text: string;
}

export interface EvaluationQuery {
  queryId: string;
  category: string;
  query: string;
  expectedPrimary: string;
  acceptableMatches: string[];
}

export interface EvaluationResult {
  totalQueries: number;
  hitAt1: number;
  hitAt3: number;
  mrrAt5: number;
  avgLatencyMs: number;
  details: Array<{
    queryId: string;
    query: string;
    expectedPrimary: string;
    topRetrieved: string[];
    hit1: boolean;
    hit3: boolean;
    reciprocalRank: number;
    latencyMs: number;
  }>;
}
