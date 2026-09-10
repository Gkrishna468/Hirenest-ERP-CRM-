# HireNest Enterprise Release Freeze Specification (v1.0 & v1.1)

**Status:** 🔒 FROZEN & PRODUCTION QUALITY GATES VERIFIED  
**Verification Date:** August 14, 2026  
**Target Platform:** HireNest CRM Core & HireNestOS  
**Active Release Tags:**  
- `release/hirenest-crm-core-v1`
- `release/hirenest-quality-control-v1`

---

## 1. System Verification & Quality Gate Results

| Verification Test | Command / Suite | Result | Details |
| :--- | :--- | :---: | :--- |
| **Type Safety** | `npm run lint` (`tsc --noEmit`) | **PASS** | 0 TypeScript errors across frontend and backend. |
| **Production Build** | `npm run build` | **PASS** | Vite client SPA bundle + esbuild CommonJS backend bundle (`dist/server.cjs`). |
| **Dev Server Runtime** | Port 3000 Ingress | **PASS** | Vite dev middleware + Express API router (`/api/*`). |
| **Data Integrity** | Law 1 & Law 2 (Firestore SSOT) | **PASS** | Single default Firestore database, zero duplicate collections, immutable `system_events`. |
| **Multi-Tenant Isolation** | Organization Isolation | **PASS** | `organizationId` claims enforced on all repositories and routers. |

---

## 2. Frozen Modules Architecture (Do Not Modify)

### 🔒 Layer 1: HireNest CRM Core (v1.0 Frozen)
1. **Candidate Ingestion Engine**:
   - `CandidateIngestionService.ts`
   - `PureResumeParser.ts` (Deterministic structured extraction)
   - `ExperienceCalculator.ts` (Total vs relevant experience verification)
   - `SkillEvidenceEngine.ts` (L0–L4 skill depth distributions)
   - `TimelineConsistencyEngine.ts` (Employment gap & overlap validation)
2. **Document Intelligence & OCR**:
   - `OcrService.ts` (Deterministic Tesseract OCR image/scanned PDF fallback)
   - PDF & DOCX binary parsers
3. **Screening & Matching**:
   - `ScreeningDecisionEngine.ts` (PASS / REVIEW / REJECT deterministic matrix)
   - `PureMatchingEngine.ts` (JD semantic skill & experience matching)
4. **Submissions & Workflow Orchestration**:
   - `SubmissionService.ts` (Submission 360, requirement state validation, candidate ownership lock)
   - `WorkflowOrchestrator.ts`
5. **Vendor Management**:
   - Vendor portal authentication, candidate bench ingestion, SLA tracking, workspace isolation.
6. **Company Ledger (Law 1)**:
   - `system_events` append-only, immutable event sourcing.

### 🔒 Layer 2: Quality Control & Vendor Intelligence (v1.1 Frozen)
1. **Quality Control Analytics**:
   - `src/pages/QualityControl.tsx`
   - `src/server/services/QualityControlService.ts`
   - `src/server/routers/quality-control.ts`
2. **Intelligence Capabilities**:
   - Sourcing Head Action Cockpit
   - Transparent Vendor Scoring (0–100 quality index, `NOT_YET_RATED` for un-screened vendors)
   - Rejection Diagnostics & Anomaly Detection (keyword stuffing, gap discrepancies)
   - Skill Evidence Gap Curves (L0–L4 breakdown)
   - Vendor Coaching dispatch engine (logs audit events to `system_events`)

---

## 3. Authoritative Firestore SSOT Collections

All modules read and write directly to these canonical collections:

- `organizations` — Enterprise tenant definitions
- `users` — Multi-tenant user accounts and RBAC custom claims
- `clients` — Client company records and BDM ownership
- `contacts` — Client & Vendor executive and TA stakeholders
- `vendors` — Vendor organizations, contact details, and tier ratings
- `requirements` — Job mandates, statuses (`OPEN`, `HOLD`, `CLOSED`), and broadcast state
- `candidates` — Canonical talent profiles, experience, and structured skills
- `candidate_screening_reports` — Deterministic screening results and rejection reasons
- `submissions` — Candidate-to-Requirement lifecycle submissions
- `interviews` — Client interview schedules, rounds, and feedback
- `offers` — Candidate job offers and compensation packages
- `placements` — Confirmed joinings and placement records
- `meetings` — Client/Vendor sales and relationship meetings
- `system_events` — Immutable, append-only Company Ledger

---

## 4. Dependencies

- **Core & Server**: `express`, `vite`, `tsx`, `esbuild`, `dotenv`, `cors`, `zod`
- **Database & Cloud**: `firebase`, `firebase-admin`, `@google/genai`
- **UI & Visualization**: `react`, `react-dom`, `lucide-react`, `motion`, `recharts`, `tailwind-merge`, `clsx`, `sonner`
- **Document & Text Parsing**: `pdf-parse`, `mammoth`, `tesseract.js`

---

## 5. Architectural Contract for Future Phases

Future development phases (including **V2 Client 360 & Commercial Sales Pipeline**) must strictly adhere to the following contracts:

1. **Consume, Do Not Mutate**: V2 modules MUST consume existing outputs from the CRM Core and QC Layer (candidates, submissions, screening decisions, placements).
2. **No Secondary Databases**: Commercial calculations, Client 360 views, and Invoices must connect to existing `clients`, `requirements`, `submissions`, and `placements` records.
3. **Explicit Commercial Math**:
   - **Client Billing Rate**: Top-line invoiced amount to client (e.g. ₹1,00,000/mo).
   - **Resource / Vendor Pay Rate**: Direct resource/vendor payout (e.g. ₹70,000/mo).
   - **Gross Profit**: `Client Billing Rate - Resource Cost` (e.g. ₹30,000).
   - **Gross Margin %**: `(Gross Profit / Client Billing Rate) * 100` (e.g. 30.0%).
   - **Markup %**: `(Gross Profit / Resource Cost) * 100` (e.g. 42.86%).
   - **Permanent Placement Revenue**: `Candidate Annual CTC * Fee %` (e.g. ₹12,00,000 * 8.33% = ₹99,960).
