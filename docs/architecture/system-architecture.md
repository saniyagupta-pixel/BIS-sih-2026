# System Architecture: AI Procurement Standards Assistant

## Overview
The AI Procurement Standards Assistant is an intelligent decision-support platform designed for public procurement officials, tender drafting committees, and specification engineers under the Government of India. The system accelerates and standardizes the identification of applicable Indian Standards (Bureau of Indian Standards - BIS) and conformity assessment certifications.

```
                         USER (Procurement Officer)
                                    |
                                    v
                     React Frontend (Government Portal)
                                    |
                                    v
                        Node.js / Express.js API
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
    In-Memory / MongoDB     Knowledge Graph         Hybrid Retrieval Engine
    Curated Standards       Relationship Engine     (BM25 + Vector Cosine)
            |                       |                       |
            +-----------------------+-----------------------+
                                    |
                                    v
                        Whitelist Grounding Layer
                     (Strict Anti-Hallucination)
                                    |
                                    v
                        LLM Reasoning / Groq API
                   (Explainability & Requirement Extractor)
                                    |
                                    v
                      Human-in-the-Loop Review
                      [Approve / Reject Action]
                                    |
                                    v
                      Final Tender Standards Summary
```

## Core Modules
1. **Frontend Portal (React 19 + Vite + Tailwind CSS)**:
   - Designed adhering to National Informatics Centre (NIC) and Government of India public digital service design standards.
   - White / Navy Blue / Slate color palette with WCAG AA compliance.
   - Interactive Knowledge Graph visualization using SVG nodes and relationship paths.
   - Comprehensive Tender Generator with instant specification parsing.
   - Interactive Procurement Officer review workflow.

2. **Backend Engine (Node.js & Express)**:
   - RESTful endpoints for catalog browsing, search, graph querying, and recommendation analysis.
   - Integrated Hybrid Retrieval Engine combining tokenized BM25/TF-IDF scoring with normalized dense embeddings.
   - Knowledge Graph traversal algorithm expanding primary matches across 1-2 hops into normative references, test methods, safety standards, and material standards.
   - Strict 7-layer Anti-Hallucination Whitelist enforcement guaranteeing no fictitious IS numbers are generated.
   - Multi-provider LLM connector (Groq API, Gemini API, and deterministic rule-based grounding fallback).

3. **Data Layer**:
   - 20 verified Indian Standards with provenance references to official BIS gazette records.
   - 6 statutory conformity assessment and certification schemes (ISI Mark Scheme I, CRS Scheme II, QCOs, STI, BEE Star Labeling).
   - Rich directed graph topology connecting standards by dependency semantics.
