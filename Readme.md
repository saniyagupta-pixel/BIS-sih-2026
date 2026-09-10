<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=800&size=32&pause=1000&color=2563EB&center=true&vCenter=true&width=800&height=80&lines=AI+Procurement+Standards+Assistant;Automated+BIS+Standard+Matching;Intelligent+Knowledge+Graphs;Built+for+SIH+2026" alt="Typing SVG" />

**An Intelligent Information Retrieval System for Government e-Procurement**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 🚀 Overview

The **AI Procurement Standards Assistant** is a specialized engine designed for **Smart India Hackathon 2026**. It solves a critical challenge in public procurement: ensuring that requested goods comply with the correct, up-to-date **Indian Standards (BIS)**.

Instead of manual standard lookup, procurement officers can input their raw tender requirements. The engine extracts the key technical properties, queries a specialized Information Retrieval (IR) vector space relying on TF-IDF & Cosine Similarity, and generates mapped standard recommendations embedded within an **interactive Knowledge Graph**.

## ✨ Key Features

- 🧠 **Smart Requirement Extraction:** Parses standard engineering terms, environments, and product names from raw text.
- 🕸️ **Interactive Knowledge Graph:** View dependencies between Primary matches and Normative references (Allied, Test, Safety standards).
- 🧑‍⚖️ **Human-in-the-Loop Validation:** Procurement Officers explicitly approve or reject standards before generation of the final annexure.
- 📊 **Automated IR Evaluation Suite:** Built-in quantitative benchmarking (Hit@1, Hit@3, MRR@5) to prove engine reliability.
- ⚡ **Offline-First Resilience:** Zero-dependency fallback to an embedded local vector simulation when external APIs are unavailable.
- 🚀 **Serverless Ready:** Configured for one-click global edge deployment via Vercel.

---

## 🏗️ System Architecture

Our solution uses a hybrid retrieval pipeline integrating deterministic rules (TF-IDF) with visually intuitive graphical interfaces.

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef core fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff;

    A[Procurement Officer Input]:::frontend -->|Text/PDF| B(API Gateway : Express):::backend
    B --> C{NLP Requirements Extractor}:::core
    C --> D[Vector Retrieval Engine]:::core
    D --> |TF-IDF / Cosine Sim| E[(Knowledge Base)]
    E --> |Matches| F[Scoring & Ranking]:::core
    F --> G[JSON Recommendations]:::backend
    G --> H[React Visualizer]:::frontend
    
    H --> I[Interactive Graph]:::frontend
    H --> J[Officer Verification]:::frontend
    J --> K[Final Tender Annexure]:::frontend
```

---

## 🛠️ Setup & Local Installation

The project uses a clean monolithic structure where Vercel can run both the Vite frontend and Express server backend securely.

### Prerequisites
- Node.js `v18+`
- npm `v9+`

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/SIH-2026.git
   cd SIH-2026
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup (Optional)**
   Copy the example `.env` file. *The application gracefully falls back to local simulation if these are missing, making development hassle-free!*
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   *Your app is now running on `http://localhost:3000` (serving both Vite frontend and Express APIs!)*

---

## ☁️ Deployment to Vercel

We have rigorously configured this repository for **Serverless Deployment on Vercel**. The setup handles static frontend delivery and serverless Express execution seamlessly.

**One-Click Method:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)  
*(Push to your own GitHub, go to Vercel, and import the repo)*

**Manual Deployment via CLI:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the terminal root.
3. Accept the default configurations (Vercel automatically recognizes the `vercel.json` config).
4. For Production: `vercel --prod`

---

## 📈 Evaluation & Benchmarks

To ensure the AI engine does not hallucinate, we integrated an academic-style **Evaluation Suite**. 

By navigating to the `/api/evaluation/run` endpoint (or checking the Dashboard Metrics widget), the system runs standard benchmark queries against our known ground-truth dataset to calculate:
- **Hit@1:** Accuracy of the top-most prediction.
- **Hit@3:** Ensure correct BIS standard is within the top 3 cards.
- **MRR@5:** Mean Reciprocal Rank to grade weighting algorithms.

---

## 👥 The CrimsonCoders Team

- **Shreyash Banzal**
- **Saniya Gupta**
- **Aastha Agrawal**
- **Yashmanglam Soni**
- **Akshat Gupta**
- **Mitali Mehra**

---

<div align="center">
  <p>Built with ❤️ by <b>CrimsonCoders</b> for Smart India Hackathon 2026</p>
</div>
