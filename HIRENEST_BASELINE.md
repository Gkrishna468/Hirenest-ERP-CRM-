# HireNest Baseline & Discovery Report (Phase 0)

**Project:** HireNest Workforce Pvt Ltd  
**Product:** HireNestOS — AI-Powered Staffing, HR Operations & Business Operating System  
**Repository:** Gkrishna468/Hirenest-ERP-CRM-  
**Baseline Build Status:** ✅ Succeeded (Zero build/compilation errors)  
**Verification Date:** August 13, 2026  

---

## 1. Application Architecture Overview

HireNest is an enterprise-grade full-stack Node.js + React application built with TypeScript, Vite, Express, and Firebase (Firestore + Auth + Storage). It functions as a dual-layer system:
- **HireNest CRM (System of Engagement):** Operations cockpit for BDMs, Recruiters, HR, Finance, and Admins.
- **HireNestOS (System of Intelligence):** AI-powered Workspaces, Matching Engine, Vendor Network Portal, and Client Portal.

### High-Level Topology:
```text
┌─────────────────────────────────────────────────────────────────┐
│                      Client Frontend                            │
│   (Vite + React 19 + Tailwind CSS + Lucide + React Router v7)   │
└─────────────────────────────────────────────────────────────────┘
                                │
                      HTTP / REST API & Websockets
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Express Backend Server                     │
│    (server.ts on Port 3000, Node 22, ESM bundler via esbuild)   │
├─────────────────────────────────────────────────────────────────┤
│ Routers: /api/vendors, /api/clients, /api/requirements,         │
│          /api/candidates, /api/submissions, /api/ai, /api/auth  │
├─────────────────────────────────────────────────────────────────┤
│ Background Agents: AgentRuntime, CommunicationGateway           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Firebase Single Source of Truth (SSOT)             │
│    - Firestore (default) Database                               │
│    - Firebase Auth (Custom Claims & Tenant Isolation)           │
│    - Firebase Storage (Resumes, Attachments)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Inspection

- **Framework:** React 19 + Vite 6 + React Router 7 (`HashRouter`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin), Lucide Icons, Sonner toasts.
- **State Management:** React Context (`AuthProvider`, `DataProvider`).
- **Core Route Groups:**
  - **Public Routes:** `/login`, `/apply/:jobId`, `/vendor-submit/:jobId`
  - **Internal CRM (PrivateRoute):** `/` (Dashboard), `/workspaces`, `/accounts`, `/contacts`, `/requirements`, `/candidates`, `/submissions`, `/interviews`, `/offers`, `/placements`, `/vendors`, `/revenue`, `/marketing`, `/mail`, `/automation`, `/settings`, `/ai-control`, `/agents`, `/knowledge-vault`
  - **Client Portal (ClientRoute):** `/client`
  - **Vendor Portal (VendorRoute):** `/vendor`
- **Integrity Layer:** `ProductionIntegrityCheck.tsx` wraps the router, displaying system integrity verification before granting access.

---

## 3. Backend / API Architecture

- **Server Entry:** `server.ts` running on port 3000 (`0.0.0.0`).
- **Middleware:** `express.json()`, global CORS handler (supporting sandboxed/iframe requests), `requireAuth` API middleware.
- **API Routers & Handlers:**
  - `/api/vendors` -> `vendorsRouter`
  - `/api/clients` -> `clientsRouter`
  - `/api/requirements` -> `requirementsRouter`
  - `/api/candidates` -> `candidatesRouter`
  - `/api/submissions` -> `submissionsRouter`
  - `/api/ai` -> `aiRouter` & `aiHandler`
  - `/api/auth` -> `authRouter`
  - `/api/system_events` -> `systemEventsRouter`
  - `/api/gmail` -> `gmailRouter`
  - `/v1` & `/api/v1` -> `openAIRouter` (OpenAI API compatibility layer)
- **Agent Runtime:** `setupAgentRuntime()` initializes `AgentRuntime`, `CommunicationAgent`, `RecruiterAgent`, and `GmailProvider`.

---

## 4. Firebase Configuration & SSOT

- **Config File:** `firebase-applet-config.json` loaded in `src/services/firebase/config.ts`.
- **Admin SDK:** `getAdminDb()`, `getAdminApp()`, `getAdminAuthClient()` in `src/server/utils/firebaseAdmin.ts`.
- **Database:** Single Firestore `(default)` database instance. No duplicate DBs.
- **Firestore Rules:** `firestore.rules` enforcing role-based permissions (`admin`, `founder`, `recruiter`, `bdm`, `vendor`, `client`).

---

## 5. Firestore Collection Inventory

The existing schema utilizes canonical collections:
- `organizations` & `users`
- `clients` & `contacts`
- `vendors` & `vendor_candidates`
- `requirements`
- `candidates` & `candidate_resumes`
- `submissions`
- `interviews`, `offers`, `placements`
- `system_events` (Immutable ledger)
- `activities`, `communications`
- `financial_records` / `revenue_records`

---

## 6. Storage & Attachments

- **Engine:** Firebase Storage.
- **Usage:** Resume files (PDF, DOC, DOCX), attachments, profile avatars.
- **Reference:** Document metadata stored in Firestore (`fileHash`, `storagePath`, `mimeType`, `uploadedBy`).

---

## 7. Authentication & RBAC

- **Auth Engine:** Firebase Authentication (client & server admin SDKs).
- **Custom Claims:** Enforces role-based isolation (`admin`, `founder`, `bdm`, `recruiter`, `vendor`, `client`).
- **Persistence:** Configured to handle iframe context with `inMemoryPersistence` fallback.

---

## 8. AI Gateway Architecture

- **Primary Gateway Controller:** `src/server/controllers/aiGateway.ts` & `src/server/controllers/ai.ts`.
- **Providers Configured:**
  - **Google Gemini (`@google/genai`):** Used for candidate parsing, requirement matching, and executive summaries.
  - **OpenAI:** Secondary fallback for complex structured output generation.
  - **Ollama (`qwen3:8b`, `deepseek-r1`, `llava`, `nomic-embed-text`):** Configured as local/open-source fallback in `ModelRegistry`.
- **Context Optimizer:** `PxPipeOptimizer` prunes large prompts while retaining critical schemas.
- **Registries:** `ModelRegistry`, `PromptRegistry`, `CapabilityRegistry`.

---

## 9. Document Processing & OCR (Resume Parsing)

- **Libraries Installed:** `pdf2json`, `pdf-parse`, `pdfjs-dist`, `pdf-lib`, `mammoth` (DOCX extraction), `multer`.
- **Parsing Flow:** File upload -> buffer text extraction -> clean text -> prompt template (`resume-parser`) -> Zod validation -> Candidate profile.

---

## 10. Candidate Ingestion Workflow

- **Service:** `CandidateIngestionService` (`src/server/services/CandidateIngestionService.ts`).
- **Intake Vectors:** Direct Recruiter upload, Vendor Portal submission, Public Job Application (`/apply/:jobId`), Bulk Talent Pool.
- **Deduplication:** Hash-based validation (`candidateHash`, `fileHash`, email matching).

---

## 11. Requirement Workflow

- **Repository:** `RequirementRepository.ts`.
- **Service:** `requirementService.ts`.
- **Flow:** Client/BDM creates requirement -> AI skills extraction -> Marketplace broadcast -> Vendor matching -> Candidate submissions.

---

## 12. Submission Workflow

- **Repository:** `SubmissionRepository.ts`.
- **Model:** Real transaction linking `candidateId`, `requirementId`, `vendorId`, `clientId`, `matchId`, `resumeVersionId`.
- **Lifecycle:** `Submitted` -> `Screened` -> `Client Submitted` -> `Interview Scheduled` -> `Offer Extended` -> `Joined` -> `Placement`.

---

## 13. CRM Module

- **Leads & Deals:** `dealsRouter`, `deals.ts`.
- **Contacts:** `contactsRouter`, `Contacts.tsx`.
- **Accounts/Clients:** `clientsRouter`, `Accounts.tsx`.
- **Activities:** Notes, calls, meetings, follow-ups mapped to timeline events.

---

## 14. Vendor Operations

- **Portal:** `/vendor` (`VendorPortal.tsx`).
- **Repository:** `VendorRepository.ts`.
- **Features:** Bench management, candidate submission to active requirements, SLA tracking dashboard.

---

## 15. HR Operations

- **Current State:** Basic employee representation exists in `users` and `UserRepository.ts`.
- **Target Expansion:** Employee 360, Attendance tracking, Leave management, Expense submission & approvals.

---

## 16. Finance Operations

- **Current State:** `financialService.ts`, `Revenue.tsx`, `revenueService.ts`.
- **Target Expansion:** Billing calculator, margin vs markup engine, sales invoices, vendor bills, GST/TDS export preparation.

---

## 17. Existing Technical Debt & Risks

1. **AI Model Selection Risk:** Needs explicit handling for project model availability checks to prevent `INVALID_ARGUMENT` errors.
2. **Duplicated Vendor Portal Utilities:** Multiple fix scripts in root directory (`fix_vendor_portal.py`, `fix_vendor_add.cjs`) indicate past ad-hoc edits.
3. **Document Intelligence Centralization:** Need to ensure ALL resume intake routes pass through a single, unified `DocumentIntelligenceService`.
4. **Commercial Calculations:** Need clear, unambiguous margin vs markup calculations across submissions and placements.

---

## 18. Reusable Core Assets Identified

- `src/server/controllers/aiGateway.ts` (Robust multi-provider AI gateway)
- `src/repositories/CandidateRepository.ts`, `RequirementRepository.ts`, `SubmissionRepository.ts`
- `src/components/ProductionIntegrityCheck.tsx` (System loading and integrity screen)
- `src/server/agents/AgentRuntime.ts` (Event-driven background agent fabric)
- `src/services/firebase/config.ts` (SSOT Firebase setup)
