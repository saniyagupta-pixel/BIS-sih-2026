# Project Chat & Development History

This document records the full chronological conversation and development history for the **AI Procurement Standards Assistant (BIS Recommendation Engine)**. Any future agent or developer working on this codebase can read this file to immediately understand previous requests, architectural decisions, solved bugs, and current status.

---

## 1. Project Overview & Architecture

- **Application Name**: AI Procurement Standards Assistant
- **Domain**: Government & Enterprise Procurement Compliance for Indian Standards (Bureau of Indian Standards / BIS).
- **Core Technology Stack**:
  - **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
  - **Backend**: Express.js (`server.ts`), Node.js.
  - **AI / IR Engine**: Hybrid dense semantic vector similarity + lexical token overlap over a curated BIS standards knowledge base, with optional Google Gemini API fallback (`GEMINI_API_KEY`).
  - **Port Configuration**: Hardcoded to `0.0.0.0:3000`.
- **Core Workflow**:
  - *"AI recommends. Procurement officer verifies."*
  - The system analyzes procurement tender specifications (custom text, uploaded files, or realistic sample presets), extracts structured requirements (product domain, operating environment, mandatory attributes), retrieves matching primary Indian Standards, expands the knowledge graph to include normative references, safety codes, and test methods, and facilitates human-in-the-loop review (approve, reject, reset).

---

## 2. Chronological Conversation & Request History

### Turn 1: Initial Implementation
- **User Request**: Create an AI-powered recommendation engine for identifying applicable Indian Standards (BIS) for procurement specifications.
- **Accomplished**:
  - Full-stack Vite + Express application architecture with server listening on port 3000.
  - Seed database of Indian Standards across diverse engineering categories (Civil & Construction, Mechanical & Industrial, Electrical & Electronics, Safety & Quality, Petroleum & Chemicals).
  - Four realistic sample tender specifications:
    1. *High-Grade OPC 53 Cement for Marine Infrastructure*
    2. *Energy-Efficient Submersible Borewell Pumps for Rural Water Supply*
    3. *High-Efficiency Monocrystalline Silicon Terrestrial Solar PV Modules*
    4. *Hot-Rolled Medium & High Tensile Structural Steel Plates for Bridges*
  - Tender Specification Generator (`TenderGeneratorView.tsx`):
    - Requirement extraction (product category, grade, operational environment, quality parameters).
    - Section B: Primary Recommended Standards with relevance scores and technical checklists.
    - Section C: Interconnected standards via knowledge graph expansion (test methods, safety codes, installation guides).
  - BIS Standards Catalog (`BISCatalogView.tsx`): Filterable, searchable directory.
  - Interactive Knowledge Graph (`KnowledgeGraphView.tsx`): Visual SVG topology of standard-to-standard relationships.
  - Evaluation Benchmark (`EvaluationView.tsx`): Precision@k, Recall@k, MAP, and MRR metrics.

---

### Turn 2: Review Feature Fix (Approve / Reject)
- **User Request**: *"the accept and reject feature is not working here."*
- **Problem Diagnosis**:
  - Review action buttons on standard cards lacked proper backend persistence and state synchronization.
- **Actions Taken**:
  - Added RESTful review endpoints in `server.ts`:
    - `POST /api/recommendations/:id/approve`
    - `POST /api/recommendations/:id/reject`
    - `POST /api/recommendations/:id/reset`
    - `POST /api/recommendations/:id/approve-all`
  - Implemented optimistic UI updates in `TenderGeneratorView.tsx` (`handleReviewAction`, `handleApproveAll`, `handleResetAll`).
  - Added toggle behavior: clicking an already approved button resets it back to pending.

---

### Turn 3: Tender-Specific Knowledge Graph
- **User Request**: 
  > *"The approve or reject feature is not working here. Also in the knowledge graph add the feature that If I generate a tender recommendation, It will specifically make a knowledge graph for the suggested and approved standards, Keeping the already existing detailed graph as it is, just add this feature also."*
- **Accomplished**:
  - Implemented dual-mode knowledge graph in `KnowledgeGraphView.tsx`:
    - **Mode 1: Full Catalog Knowledge Graph**: Preserved original comprehensive graph covering all BIS standards in the database.
    - **Mode 2: Tender Recommendation Graph**: Dynamically generated 3-tier hierarchy specifically for the active tender recommendation:
      - **Tier 1**: Extracted Procurement Tender Requirement Root Node.
      - **Tier 2**: Primary AI-Recommended Product Standards.
      - **Tier 3**: Connected Normative References, Safety Codes & Test Method Standards.
  - Built-in interactive Tender Standard Inspector drawer allowing officers to inspect technical parameters and directly **Approve**, **Reject**, or **Reset** standards from inside the graph.
  - Cross-view synchronization between `TenderGeneratorView` and `KnowledgeGraphView` via `activeRecommendation` state in `App.tsx`.
  - Added visual cues: Emerald glow/ring for Approved, Rose ring for Rejected, Blue for Candidate, score badges, and connection labels.

---

### Turn 4: Approve / Reject Count Bug Fix & Custom Specification Verification
- **User Request**:
  > *"the approve and reject buttons are working but the approve/ reject count is not changing accordingly and same bug is there in the tender recommendation graph."*
- **User Question**:
  > *"If I give a custom tender specification, will it be able to generate recommendations?"*
- **Problem Diagnosis**:
  1. Standard ID casing/whitespace mismatches: Clicking an action could fail to match if `standardId` had differing casing or whitespace.
  2. Filtered-array recursion in `KnowledgeGraphView`: Filter button counts were using `tenderGraphTopology.nodes.filter(...)`. When the user clicked "Approved Only", `tenderGraphTopology.nodes` only had approved nodes, causing "All Standards" and "Pending Review" counts to incorrectly collapse to 0 or match the filtered subset.
  3. Missing counters: Neither component had dedicated counts for **Rejected** items or **Pending** items.
  4. Missing "Rejected Only" filter in the Tender Graph view.
  5. Inspector drawer node resolution: If a user approved a node while under the "Pending" filter, the node disappeared from the filtered array, causing `selectedTenderNode` to become null and close the inspector drawer abruptly.
- **Actions Taken**:
  1. Normalized standard ID matching using `.toLowerCase().trim()` across all handlers in `TenderGeneratorView.tsx`, `KnowledgeGraphView.tsx`, and `server.ts`.
  2. Created independent count calculations derived directly from the complete `result` / `currentRec` objects:
     - `totalApproved`, `totalRejected`, `totalPending`, and `totalStandards`.
  3. Added a dedicated **"Rejected Only ({totalTenderRejected})"** filter button in `KnowledgeGraphView.tsx`.
  4. Updated header banners, Section B, Section C, and Section G in `TenderGeneratorView.tsx` with dedicated badges for Approved, Rejected, and Pending standards.
  5. Updated `selectedTenderNode` in `KnowledgeGraphView.tsx` to search across the full `currentRec` data, ensuring the inspector drawer remains open and immediately updates its decision status when toggled.
  6. Verified that custom tender specifications (text input or uploaded files) trigger the full analysis pipeline, populate recommendations, and render the custom 3-tier knowledge graph seamlessly.
  7. Added `POST /api/recommendations/:id/reset-all` backend endpoint in `server.ts`.
  8. Verified build and TypeScript compilation via `lint_applet` and `compile_applet`.

---

## 3. Key Components & File Map

| File Path | Description |
|-----------|-------------|
| `/server.ts` | Express server, semantic analysis pipeline, in-memory recommendation storage, and review endpoints (`/api/recommendations/*`). |
| `/src/App.tsx` | Top-level application shell, tab switching, and `activeRecommendation` global state synchronization. |
| `/src/components/tender/TenderGeneratorView.tsx` | Tender specification analysis interface, sample presets, file upload, recommendation cards, review actions, and export summary. |
| `/src/components/graph/KnowledgeGraphView.tsx` | Dual-mode Knowledge Graph (Catalog Graph + Tender Recommendation Graph) with SVG rendering, status filtering, and node inspector. |
| `/src/components/catalog/BISCatalogView.tsx` | Searchable, filterable directory of Indian Standards with technical specs. |
| `/src/components/evaluation/EvaluationView.tsx` | Retrieval evaluation metrics (Precision@k, Recall@k, MAP, MRR). |
| `/src/components/about/AboutView.tsx` | Architecture overview, scoring methodology, and system documentation. |
| `/src/types.ts` | Data contracts: `Standard`, `RecommendationResponse`, `PrimaryRecommendation`, `RelatedStandard`, `GraphNode`, `GraphLink`. |
| `/metadata.json` | Platform metadata (Name: "AI Procurement Standards Assistant", description, permissions). |

---

## 4. State Synchronization Rules for Future Agents

1. **Shared Recommendation State**:
   - `App.tsx` holds `activeRecommendation`.
   - When `TenderGeneratorView` updates decisions, it calls `onActiveRecommendationChange(newResult)`.
   - When `KnowledgeGraphView` updates decisions, it calls `onActiveRecommendationChange(updatedRec)`.
2. **Review Status States**:
   - Standards have three possible statuses: `'pending'` (default), `'approved'`, and `'rejected'`.
   - Clicking an already-active action button toggles the status back to `'pending'`.
3. **Case Sensitivity**:
   - Always compare standard IDs with `.toLowerCase().trim()` to prevent mismatch between formats like `"IS 12269"`, `"is 12269"`, or `"IS_12269"`.
4. **Build & Test**:
   - Build check: `compile_applet`
   - Lint check: `npm run lint` / `tsc --noEmit`
   - Server runs on port 3000 (`0.0.0.0:3000`).