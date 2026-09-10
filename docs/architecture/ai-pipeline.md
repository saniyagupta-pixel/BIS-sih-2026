# AI Pipeline & Hallucination Prevention

## Pipeline Steps
1. **Input Normalization & Parsing**:
   - Cleans tender text, extracts technical keywords, product categories, target environmental constraints, and electrical/mechanical ratings.
2. **Hybrid Semantic + Lexical Retrieval**:
   - `Semantic Score`: Cosine similarity between query embedding and pre-indexed standards representation.
   - `Lexical Score`: BM25/TF-IDF token matching on titles, keywords, and specifications.
   - `Scope & Category Score`: Domain categorization boost.
   - `Score Formulation`:
     $$\text{FinalScore} = 0.45 \cdot S_{\text{semantic}} + 0.20 \cdot S_{\text{scope}} + 0.15 \cdot S_{\text{category}} + 0.10 \cdot S_{\text{application}} + 0.10 \cdot S_{\text{relationship}}$$
3. **Knowledge Graph Expansion**:
   - For top candidates, expands connected nodes up to 2 hops:
     - `NORMATIVE_REFERENCE`: Standards strictly required to implement the primary standard.
     - `TEST_METHOD`: Mandatory lab test protocols.
     - `SAFETY_STANDARD`: Electric shock, fire retardance, drop test, or mechanical safety codes.
     - `MATERIAL_STANDARD`: Raw material specifications (steel, cement, polymers).
     - `INSTALLATION_STANDARD`: Site commissioning and grounding codes (e.g. IS 3043).
4. **Certification & Conformity Matching**:
   - Matches applicable Quality Control Orders (QCO) and BIS schemes (ISI Mark, CRS).
5. **Strict Grounding & Whitelist Validation**:
   - The LLM receives exclusively the verified retrieved candidate IDs.
   - Any LLM suggestion with an unverified or unknown standard number is instantly stripped.
6. **Human Procurement Officer Review**:
   - Officers approve or reject recommendations with transparent reasonings.
