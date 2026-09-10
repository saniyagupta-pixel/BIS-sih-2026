# API Documentation: AI Procurement Standards Assistant

## Base URL
`/api`

## Endpoints

### 1. Health Check
`GET /api/health`
- Response: `{ status: "ok", mode: "offline_prototype_grounded", standardsLoaded: 20, certificationsLoaded: 6 }`

### 2. Dashboard Statistics
`GET /api/dashboard/stats`
- Computes dynamic counts: total standards, certifications, graph relationships, categories, amendments count, and average benchmark confidence.

### 3. Categories Summary
`GET /api/dashboard/categories`
- Lists supported product categories with standards count and sample codes.

### 4. Standards Directory & Search
- `GET /api/standards` - Returns all verified standards with category/status filters.
- `GET /api/standards/:id` - Detailed view of standard including full scope, technical requirements, amendments, and source provenance.
- `GET /api/standards/search?q=query` - Full-text and keyword search across standards.

### 5. Certifications Catalog
- `GET /api/certifications` - List of BIS and statutory conformity schemes.
- `GET /api/certifications/:id` - Specific scheme details and applicable products.

### 6. Knowledge Graph
- `GET /api/graph` - Complete graph nodes and edges for visualization.
- `GET /api/graph/:standardId` - Subgraph focused on a specific standard up to 2 hops.

### 7. Tender Recommendation Engine
- `POST /api/recommendations/analyze`
  - Body: `{ specificationText: string, category?: string }`
  - Returns: Extracted requirements, primary recommendations, categorized related standards (normative, test, safety, material, installation), certification schemes, explainability breakdown, and anti-hallucination validation metadata.
- `POST /api/recommendations/:id/approve`
  - Records officer approval.
- `POST /api/recommendations/:id/reject`
  - Records officer rejection with optional comments.

### 8. Evaluation Benchmark
- `GET /api/evaluation/run`
  - Executes retrieval benchmark on test queries and returns Hit@1, Hit@3, MRR@5, and execution latency.
