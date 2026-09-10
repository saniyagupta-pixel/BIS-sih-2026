# Agent Guidelines & Project State

> **Notice for AI Agents**: This project is the **AI Procurement Standards Assistant (Bureau of Indian Standards / BIS AI Recommendation Engine)**.
> Detailed conversation history, solved bugs, and architectural decisions are documented in **`CHAT_HISTORY.md`**.

## Critical Application Facts

1. **Port & Runtime**:
   - The application runs an Express backend bundled with Vite.
   - The server **MUST** listen on `0.0.0.0:3000`.
   - Start script: `node server.ts` / `tsx server.ts`.

2. **Core Functionality**:
   - **Procurement Requirement Extraction**: Parses tender text and documents to extract technical parameters.
   - **BIS Recommendation Engine**: Matches tender specifications against Indian Standards (`IS 12269`, `IS 800`, `IS 14286`, etc.) and surfaces normative references, test methods, and installation codes.
   - **Human-in-the-Loop Verification**: Procurement officers approve or reject standards.
   - **Tender Knowledge Graph**: Dedicated 3-tier relationship graph visualizing the active tender recommendation alongside the full catalog graph.

3. **Key Files**:
   - `/src/App.tsx`: Manages `activeRecommendation` shared state between views.
   - `/src/components/tender/TenderGeneratorView.tsx`: Main procurement analysis and review view.
   - `/src/components/graph/KnowledgeGraphView.tsx`: Dual-mode graph with Tender Recommendation Graph and Full Catalog Graph.
   - `/server.ts`: Semantic search engine and review API routes (`/api/recommendations/*`).
   - `/CHAT_HISTORY.md`: Comprehensive history of user requests, bug fixes, and system design.

4. **Review Status Synchronization**:
   - Always match standard IDs case-insensitively using `.toLowerCase().trim()`.
   - Maintain independent counters (`totalApproved`, `totalRejected`, `totalPending`) derived directly from the global recommendation object.
   - Synchronize updates back to `App.tsx` via `onActiveRecommendationChange`.
