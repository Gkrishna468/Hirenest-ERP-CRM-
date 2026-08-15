# HireNest Workforce Strict Profile Screening Engine - Baseline Documentation

## 1. Existing Architecture Overview
- **Frontend**: React 18 with Vite, Tailwind CSS, Lucide icons, Motion, Context API (`DataContext`, `AuthContext`), and responsive dashboards (Candidates, Vendor Portal, Requirements, Submissions).
- **Backend**: Express on Node.js / TypeScript, modular controllers & routers (`candidates.ts`, `submissions.ts`, `requirements.ts`, `system_events.ts`).
- **Database & Storage**: Firestore `(default)` as Enterprise Single Source of Truth (SSOT), Firebase Auth with custom claims, Firebase Storage for document payloads.
- **Ledger & Events**: `system_events` immutable Company Ledger recording all audit trails and state transitions.

## 2. Ingestion & Screening Workflows
- **Candidate Ingestion Points**:
  - Direct Candidate Portal (`PublicApply.tsx`)
  - Vendor Partner Submissions (`VendorSubmit.tsx`, `SingleProfileForm.tsx`)
  - Recruiter / Admin Direct Intake (`Candidates.tsx`, `TalentPoolBulkForm.tsx`)
- **Document Ingestion**:
  - File validation, mime-type verification (.pdf, .docx).
  - Deterministic text extraction via PDF & DOCX extractors + Tesseract OCR fallback for scanned images.
- **Candidate Screening Engine (Deterministic)**:
  - Extract sections: Summary, Skills, Experience, Projects, Education, Certifications.
  - Separate **Total Experience** from **Relevant Experience**.
  - 5-Tier Evidence Level validation for technical skills (Level 0 through Level 4).
  - Keyword stuffing detection (`KEYWORD_ONLY_PROFILE`) and timeline inconsistency checks.
  - Structured Explainable Match Scoring (Skills 35%, Relevant Exp 20%, Project Evidence 10%, Tech Depth 10%, Title 10%, Domain 5%, Location 5%, Notice 5%).
  - Hard Rejection Rules & Rejection Engine with explicit explanatory feedback.
  - Linked directly to `requirementId`.
  - LinkedIn Profile URL normalization and manual verification badge.

## 3. Preserved Architecture & Safety Guardrails
- Existing collections preserved: `candidates`, `requirements`, `submissions`, `vendors`, `clients`, `system_events`, `candidate_identity_vault`.
- No LLM dependency in the core screening decision loop (100% deterministic & offline capable).
- No arbitrary / fake fallback scores (e.g. `|| 75`).
- Unscreened candidates marked as `LEGACY_UNSCREENED`.
