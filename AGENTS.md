# HireNest OS & CRM Governance Rules

## SYSTEM STATUS
**HireNest OS & CRM: Release Candidate 1 (RC-1) Mode**
Status: ACTIVE RC-1 TRANSITION - QUALITY GATES ENFORCED

## Law 1: Company Ledger
- `system_events` is the **Company Ledger**.
- Properties: Append-only, Immutable, Timestamped, Auditable, Role Protected.
- Rules:
  - CREATE = allowed
  - READ = role based
  - UPDATE = denied
  - DELETE = denied
- Foundation for Revenue reporting, Activity timeline, AI context, Executive dashboards, and Compliance audits.

## Law 2: Unified Enterprise Data Model (Single Source of Truth)
- Every business entity (Vendor, Client, Requirement, Candidate, Submission, Interview, Offer, Placement, Organization, User) exists exactly once in the `(default)` Firestore database.
- HireNest CRM and HireNestOS must never maintain separate copies of the same entity. All applications read and write the shared document directly through repositories and services. 
- Any update made from CRM, Vendor Workspace, or Client Workspace is immediately visible everywhere because all interfaces consume the same Single Source of Truth.
- No duplicate databases. No shadow business logic.

## Law 3: AI Governance
- NEVER enable AI automation until data stability and migration completion are proven.
- AI MAY: Analyze, Rank, Draft, Recommend, Forecast.
- AI MAY NOT: Send emails automatically, Modify revenue, Change candidate stages, Approve offers, or Escalate permissions without explicit Founder approval.
- AI outputs (outreach, engagement drafts, forecasts) belong in a review stage for Founder/Admin approval before dispatch.

## Law 4: Migration Protocol
- Governed cutover sequence:
    1. 72-hour soak test
    2. Phase 5 Read Cutover
    3. Phase 6 Write Cutover (Rollout: 10% -> 25% -> 50% -> 100%)
    4. 14-day bake period
    5. Supabase retirement
- Cutover Authorization relies STRICTLY on Data Evidence: 100% Parity across Records, Fields, Relationships, and Events.
- **Rollback Plan Required**: If parity < 100% OR Failed events > 0 OR Dashboard variance detected -> rollback to Supabase reads. Never migrate without rollback.
- Supabase acts as a read-only rollback system for at least 14 days post-cutover before decommissioning.

## Law 5: Domain-Driven Design & SSOT
- **Shared Enterprise Data Model** via Firestore (default).
- CRM is the System of Engagement (Operations). OS is the System of Intelligence (AI & Workspaces).
- **Event-Driven Flow**: Domains NEVER duplicate each other's collections. They emit and react to `system_events`.
- **Database-Enforced Ownership**: Firestore security rules must enforce these boundaries.

## RC-1 Governance Rules (During Soak Test)
- **Allowed**: Bug fixes, Logging, Monitoring, Parity improvements, Performance tuning, Security hardening.
- **Forbidden**: New AI features, Schema changes, Collection renames, New integrations, UI redesigns, Vendor automation.
- Feature freeze protects migration integrity.

## HireNest v1.0 Architecture (Frozen)
- **HireNest CRM**: Commercial Command Center (Relationship Layer). Admins, BDMs, Recruiters, Sales.
- **HirenestOS**: Execution & Intelligence Platform (Workspaces & AI Layer). AI Agents, Matching Engine, Client Workspaces, Vendor Workspaces.
- **Shared Enterprise Data**: `clients`, `vendors`, `requirements`, `candidates`, `submissions`, `interviews`, `offers`, `placements`, `deal_rooms`.
- **system_events**: Company Ledger (Event Fabric).
- **Firebase**: Enterprise SSOT.

## Founder Principle
- **North Star**: "No Profile Left Behind". Every profile submitted must either become Feedback, Interview, Offer, Join, or Redeployment. No candidate should disappear into email threads.

## Executive Sprints & Execution Phase
- **Sprint 1: Gmail Ingestion Engine**: Highest ROI. Google Workspace Gmail API -> Pub/Sub Webhooks -> Cloud Functions -> Firestore -> `system_events`. Strict avoidance of browser-managed OAuth in favor of Server-Side Refresh Tokens and Service Account Processing. Collections: `gmail_connections`, `gmail_messages`, `email_threads`, `attachments`.
- **Sprint 2: Vendor Excel Parser**: Intercept Vendor emails -> Parse attachment -> Extract Candidates -> Auto-create `submission_batches`, `candidate_submissions`, `candidate_feedback` mapped to Vendor and Client Requirements -> Create Follow-up -> Generate Event.
- **Sprint 3: Feedback SLA Engine**: Deterministic rules. 3 Days -> Reminder. 7 Days -> Escalation. 10 Days -> Founder Alert. Generates events: `CLIENT_DELAYED`, `FOLLOWUP_REQUIRED`, `REVENUE_BLOCKED`. Dashboard tracks pending feedback, average delay, and revenue blocked.
- **Sprint 4: Candidate Redeployment Engine**: High ROI focus. Detect candidates waiting > 5 Days with > 85% match score for other requirements -> Auto-suggest alternate deployment -> Founder approves -> Resubmit. Converts idle inventory into revenue.

## Vendor Intelligence Agent
- Represents a BDM. Reads Gmail, identifies Vendor/Client/Requirement, counts profiles shared, tracks feedback status, schedules follow-ups, escalates delays, suggests redeployment.
- **Crucial Flow**: Agent proposes -> Founder approves -> System executes.

## Memanto Integration Strategy
- Delay implementation until base workflows are rock solid. Use cases: Vendor Relationship Memory, Client History, Conversation Memory, Follow-up Context, Account Intelligence (Not as the transaction engine).

## Production Readiness Checklist (Pre-Gmail Automation)
- [x] Firebase migration complete (Firestore SSOT active & unified)
- [x] Phase 5 read cutover complete (Verified with 100% telemetry validation)
- [x] Phase 6 write cutover complete (Multi-tenant isolation active)
- [ ] Gmail OAuth server-side only
- [ ] Refresh tokens encrypted
- [ ] Event idempotency enabled
- [x] `system_events` immutable (Enforced via Firestore Security Rules - Law 1)
- [x] Role-based access enforced (Claim-aware custom token structure active)
- [ ] Disaster recovery tested
- [ ] Replay tests successful

## UI/UX Philosophy
- Clean, minimal, high-contrast layouts.
- Always include an Executive View (Business Health Score) for the Admin/Founder roles.
- Actions create events. Events create timelines. Timelines create intelligence.

## Unified Business Workflow Layer (Execution Roadmap)

- **Phase 1: Organization (Tenant) Foundation**
  Every document across `users`, `clients`, `vendors`, `requirements`, `candidates`, `submissions`, and `placements` must contain `organizationId`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, `sourceApp` (CRM | OS | API | AI), and `sourceWorkspace` (Vendor | Client | Recruiter | Admin).
- **Phase 2: Client Workspace (OS)**
  Client portal to manage Open Requirements, Submissions, Interviews, Offers, and Placements directly from OS, writing instantly to SSOT.
- **Phase 3: Vendor Workspace**
  Delivery portal for Vendors to upload Bench, update Resumes/Availability, and submit Candidates, with all actions reflecting live in CRM.
- **Phase 4: Recruiter Workspace (CRM)**
  Operations cockpit linking Requirements with AI Matches, Vendor/Internal Candidates, and 1-click Submissions.
- **Phase 5: AI Agent Layer**
  Background intelligence (Vendor Agent, Client Agent, Recruiter Agent, COO Agent) providing smart prompts and automation triggers.
- **Phase 6: Communication Hub**
  Emails, WhatsApp, Calls, and Notes unified directly under Vendor, Client, and Candidate entities.
- **Phase 7: Universal Timeline**
  Standardized Event-Sourcing visualization bridging the lifecycle across Candidates, Vendors, and Clients.

---

# HireNest RC-1 (Release Candidate) Charter

## Release Goal

**Objective:** Deliver a production-grade Unified Staffing Operations Platform where CRM (Operations) and HireNestOS (Intelligence) operate on a single Firestore `(default)` database with deterministic workflows, enterprise security, and end-to-end observability.

**Feature Freeze Rule:** No new platform modules until all RC-1 gates pass. Only bug fixes, workflow completion, performance optimization, security hardening, and UX refinement are permitted.

---

# Gate 1 – Production Validation (P0)

Every business workflow must pass end-to-end using the live SSOT.

## Vendor Lifecycle

```text
Vendor Created
↓
Vendor Login
↓
Bench Upload
↓
Candidate Created
↓
Candidate Updated
↓
Monthly Validation
↓
Performance Updated
```

**Acceptance Criteria**

* Vendor created once in Firestore.
* Firebase Auth user provisioned.
* Vendor visible in CRM and OS immediately.
* No duplicate candidate creation.
* No synchronization jobs.

---

## Client Lifecycle

```text
Client Created
↓
Client Login
↓
Requirement Created
↓
Requirement Updated
↓
Requirement Closed
```

**Acceptance Criteria**

* Requirement appears instantly in CRM.
* AI Matching triggered automatically.
* Vendor Marketplace updated automatically.

---

## Recruitment Workflow

```text
Requirement
↓
Candidate Match
↓
Submission
↓
Interview
↓
Offer
↓
Joining
↓
Placement
```

Every transition must:

* Update Firestore.
* Publish a business event.
* Update dashboards.
* Update timelines.
* Notify participants.

---

# Gate 2 – Workflow Engine Validation

Every workflow should execute through the Workflow Orchestrator.

Example:

```text
Candidate Submitted
↓
Submission Service
↓
Workflow Orchestrator
↓
Update Submission
↓
Update Candidate
↓
Publish Event
↓
Notify Client
↓
Notify Vendor
↓
Start SLA Timer
↓
AI Analysis
```

No controller should coordinate multiple services directly.

---

# Gate 3 – Repository Validation

Confirm:

* No UI writes directly to Firestore.
* No controller writes directly to Firestore.
* Every write flows:

```text
UI
↓
Router
↓
Service
↓
Repository
↓
Firestore
```

---

# Gate 4 – Security Hardening

Validate:

## Authentication

* Firebase Auth
* Custom Claims
* Organization Isolation
* Token Refresh
* MFA (where applicable)

## Authorization

| Role      | Access                |
| --------- | --------------------- |
| Founder   | Full                  |
| Admin     | Full Org              |
| BDM       | Assigned Clients      |
| Recruiter | Assigned Requirements |
| Vendor    | Own Workspace         |
| Client    | Own Workspace         |

---

# Gate 5 – Observability

Every request should have:

```text
Request ID
Correlation ID
Workflow ID
Organization ID
Actor ID
Latency
Result
```

Log:

* Errors
* AI Calls
* Workflow duration
* Firestore writes
* Authentication failures

---

# Gate 6 – Disaster Recovery

Validate:

* Firestore Scheduled Backups
* Restore Procedure
* Event Replay
* Cloud Storage Recovery
* AI Queue Recovery

Document Recovery Time Objective (RTO) and Recovery Point Objective (RPO).

---

# Gate 7 – Performance

Target metrics:

| Metric            |   Target |
| ----------------- | -------: |
| CRM Page Load     |    < 2 s |
| Vendor Dashboard  |    < 2 s |
| Client Dashboard  |    < 2 s |
| Candidate Upload  |    < 5 s |
| Requirement Match |    < 3 s |
| AI Response       |    < 8 s |
| Firestore Query   | < 300 ms |

Run load tests with concurrent uploads, requirement creation, and dashboard activity.

---

# Gate 8 – UX Refinement

Focus on reducing friction:

* Minimize clicks.
* Improve loading states.
* Consistent status badges.
* Keyboard shortcuts where appropriate.
* Better error messages.
* Mobile responsiveness for Vendor and Client Workspaces.

---

# Gate 9 – Business Intelligence

Validate executive dashboards against live data:

* Revenue Pipeline
* Placements
* Active Requirements
* Candidate Inventory
* Vendor Performance
* Client Health
* Recruiter Productivity
* AI Automation Rate
* SLA Compliance

No mocked metrics.

---

# Gate 10 – Release Readiness Checklist

A release should not proceed until all items are green:

* ✅ Single Firestore `(default)` SSOT
* ✅ Repository Pattern enforced
* ✅ Workflow Orchestrator active
* ✅ Domain Events implemented
* ✅ AI Agents event-driven
* ✅ Vendor Workspace complete
* ✅ Client Workspace complete
* ✅ CRM complete
* ✅ Authentication validated
* ✅ Authorization validated
* ✅ Performance validated
* ✅ Observability enabled
* ✅ Disaster Recovery documented
* ✅ Security Rules verified
* ✅ End-to-end regression suite passing
* ✅ Data Integrity scans verified (Gate 11)
* ✅ AI Health monitoring active (Gate 12)

---

# Gate 11 – Data Integrity

Every deployment and continuous monitoring process must verify:

* ✓ **No orphan candidates**: Every candidate must belong to a valid registered vendor or internal system owner.
* ✓ **No orphan submissions**: Every candidate submission must map to a valid open requirement and candidate.
* ✓ **No orphan requirements**: Every requirement must belong to an active, validated client.
* ✓ **No orphan vendors**: All vendors must have corresponding Firebase Auth user records and custom claims.
* ✓ **No orphan clients**: All clients must possess a corresponding client workspace and assigned BDM.
* ✓ **All organizationIds valid**: Universal organization partitioning enforced across every business entity.
* ✓ **All userIds valid**: High fidelity mapping of users to organizational tenants with no broken references.

---

# Gate 12 – AI Health

An operational gate for the AI intelligence layer must track and enforce:

* **Provider availability**: Fallbacks between primary models and secondary providers.
* **Average latency**: Maintaining AI-driven responses within SLA limits (< 8 s).
* **Parse success rate**: Extracted entity accuracy validation with structural schemas.
* **Fallback and recovery**: Graceful fallback to deterministic parsing models if LLM services are offline.
* **Queue depth and cost**: Proactive monitoring of AI-reprocessing pipelines and token consumption rates.
* **Failed inference and retry tracking**: Automating transient failures without impacting end-user experience.

---

# RC-1 Priority Order (P0 → P3)

## P0 – Platform Stability (Must be 100% Green)
These are absolute release blockers:
* **Zero 500/409/405 API Errors**: Every endpoint must be fully robust with correct HTTP statuses.
* **No Mock Data**: Every module must connect and transact exclusively with live Firestore collections.
* **Firestore (default) Exclusivity**: Remove any remaining legacy `ai-studio-*` databases or shadow sync routines.
* **Auth & Claims Parity**: Secure multi-tenant organization isolation and claim-based access controls fully verified.
* **Core Creation & Ingestion**: End-to-end reliability for Vendor/Client registration and Candidate Resume ingestion.

## P1 – SSOT Validation
All entities must exist exactly once in their canonical collections: `organizations`, `users`, `clients`, `vendors`, `requirements`, `candidates`, `submissions`, `interviews`, `offers`, `placements`, and `system_events`. CRM and OS must read and write directly to these same shared paths.

## P2 – Cross Workspace Validation
Real-time, bidirectional visibility between roles:
* **Vendor Creates Candidate** → Document instantly visible in CRM, Recruiter cockpit, Client submission boards, and AI Matching Engine.
* **Client Creates Requirement** → Document instantly visible in CRM, Recruiter workspace, AI evaluation queue, and Vendor Marketplace.
* **Recruiter Updates Submission** → Updates propagate instantly to the timeline, client and vendor portals, and write a ledger event to `system_events`.

## P3 – Workflow Validation
Automatic execution of the unified staffing journey without manual syncing: `Vendor` → `Candidate` → `Submission` → `Interview` → `Offer` → `Joining` → `Placement` → `Invoice` → `Payment`.

---

# RC-1 Bug Policy

## Critical (Fix Immediately)
* Data loss or corruption
* Duplicate Candidate, Vendor, or Client creation
* Multi-tenant data leaks or custom claims failure
* Firestore security rules violations or permission failures

## High (Address within 24 Hours)
* Key operational workflow path broken (e.g. scheduling, matchmaking)
* Executive dashboards showing incorrect or inconsistent metrics
* AI Matcher or resume parsing pipeline halts
* Universal timeline event sequencing incorrect

## Medium (Address within Release Cycle)
* Minor UI layout glitches or flickering
* Missing or non-responsive loading indicators
* Pages loading with higher latency than the RC targets

## Low (Aesthetic & Polish)
* Micro-interaction adjustments, iconography alignment, or typography updates
* Minor wording or copywriting enhancements

---

## RC-1 Success Criteria & Definition of GA

The platform is considered **Release Candidate Ready** and qualifies for **General Availability (GA)** when the complete unified staffing lifecycle completes without manual intervention, synchronization jobs, or direct database patches:

```text
1. Admin creates a client in CRM.
        ↓
2. Client logs into the Client Workspace (OS).
        ↓
3. Client posts a new hiring Requirement.
        ↓
4. Requirement stored in Firestore & visible instantly in CRM & OS.
        ↓
5. AI Matching starts & Vendor Marketplace receives broadcast.
        ↓
6. Vendor logs into Vendor Workspace & uploads Candidate Bench.
        ↓
7. Candidate added to SSOT & matched automatically via AI.
        ↓
8. Recruiter reviews AI suggestion & submits Candidate.
        ↓
9. Client receives submission & schedules Interview directly.
        ↓
10. Offer is issued, accepted, and Candidate joining is confirmed.
        ↓
11. Placement record is created & financial records are generated.
        ↓
12. Notifications are sent & system_events records every action.
        ↓
13. Executive dashboards update automatically from live Firestore.
```

This single end-to-end journey serves as the ultimate quality gate. Once it runs flawlessly under concurrent loads and satisfies all 12 Gates, HireNest has achieved its final architectural goal: CRM as the System of Engagement and HireNestOS as the System of Intelligence, unified by a single Firestore Single Source of Truth.

---

# HireNest RC-2 (Release Candidate 2) Vision & Enterprise Architecture

## 1. High-Level Blueprint

```text
                    HIRENEST ENTERPRISE PLATFORM

                        Firestore (default)
                  Enterprise Single Source of Truth
                               │
      ─────────────────────────┼─────────────────────────
                               │
                  Immutable Company Ledger
                   (system_events + workflows)
                               │
       ┌───────────────────────┴───────────────────────┐
       │                                               │
       ▼                                               ▼

 HireNest CRM                                 HireNest OS
 System of Execution                     System of Intelligence

 Humans perform work                 AI observes, predicts,
                                     automates and coordinates
```

## 2. Layer 1 — Firestore (Enterprise Data Layer)

There is **one document for every business object**. No synchronization, no duplicate collections, no copying, no mirror collections. Every workspace, service, and interface reads from the same documents.

Canonical collections include:
- `organizations`, `users`
- `clients`, `vendors`, `contacts`
- `requirements`, `candidates`, `submissions`
- `interviews`, `offers`, `placements`
- `invoices`, `payments`
- `activities`, `communications`
- `system_events`
- `workflow_events`, `notifications`, `tasks`

## 3. Layer 2 — HireNest CRM (System of Execution)

CRM is where human operators perform work (Admins, BDMs, Recruiters, Finance, Operations). Every interaction creates or updates transaction records in Firestore, which publishes ledger-events.
CRM never contains intelligence, nor does it perform background automation directly. It processes transactions.

*Example:*
```text
Create Requirement  ──►  requirements  ──►  system_events  ──►  AI Notified
```

## 4. Layer 3 — HireNest OS (System of Intelligence)

OS does not own separate business databases. It watches the Firestore Event Stream to run the AI Runtime, compile insights, recommend actions, and execute auto-orchestrated pipelines.

```text
Firestore  ──►  Event Stream  ──►  AI Runtime  ──►  Insights & Automation  ──►  Recommendations
```

## 5. Communication Layer (Data-Structured Hub)

Every external channel converts directly into structured data attached to the canonical Firestore timelines:
- **Email/MailOS**: Gmail API parses emails into thread timelines, driving automatic follow-up reminders and SLA analytics.
- **WhatsApp**: Triggers requirement broadcast replies directly into candidate submissions.
- **LinkedIn**: Converts outreach responses into CRM leads.
- **Calendar**: Logs interview feedback loops.
- **Phone**: Attaches call summaries to Candidate and Client timelines.

## 6. AI Runtime & Workflow Engine

All system pipelines are event-driven rather than polling-driven:
- `REQUIREMENT_CREATED`: Starts matching engine, updates vendor ranking, and triggers a marketplace broadcast.
- `CANDIDATE_ADDED`: Drives resume parsing, skill extraction, and auto-matching score generation.
- `CLIENT_FEEDBACK_PENDING`: Runs escalation loops (3 days ──► reminder; 7 days ──► escalation; 10 days ──► founder alert).

Every key business entity owns a dedicated, searchable timeline lifecycle (e.g., *Candidate Timeline*, *Requirement Timeline*, *Vendor Timeline*).

## 7. Autonomous Offices & AI COO

Instead of loose agent scripts, intelligence is organized into specialized departments:
- **Recruitment Office**: Requirements, AI matching, recruiter performance.
- **Vendor Office**: Vendor SLA, bench quality, network performance.
- **Client Office**: Client health, feedback loops, escalations.
- **Finance Office**: Invoicing, collections, revenue tracking.
- **Founder Office**: Full enterprise control.

At the apex is the **AI COO**, synthesizing performance data to provide clear daily priorities (e.g., flagging revenue blocks, pointing out high-probability matches, and identifying performance risks).

## 8. Law: Read Model Separation

Instead of every dashboard and view querying Firestore differently, define one read model (ViewModel / Service Layer) per business entity:

- **Vendor Read Model (`VendorService` / `VendorRepository`):**
  - Fetches: `vendors`, `submissions`, `placements`, and `system_events`.
  - Produces: `Vendor360` ViewModel.
  - Consumed by: CRM, OS, Vendor Portal, and Founder Dashboard.
- **Requirement Read Model (`RequirementService` / `RequirementRepository`):**
  - Fetches: `requirements`, `submissions`, and `matches`.
  - Produces: `Requirement360` ViewModel.
  - Consumed by: CRM, OS, Client Portal, and AI Engine.

This ensures every interface sees the exact same business object with identical calculations, avoiding visual or functional discrepancies across CRM and OS.

---

# HireNest GA (General Availability) Validation Suite

To prove the architectural integrity of the platform, the following end-to-end workflow suite must pass cleanly before considering the platform production-ready:

### Test 1: Vendor Onboarding & Multi-Workspace Sync
- **Action:** Create a Vendor in CRM.
- **Verification:** Ensure the vendor document immediately propagates and is visible in:
  - CRM Vendor Lists
  - Vendor360 ViewModel
  - Vendor Workspace (OS Portal)
  - Founder / Executive Dashboard

### Test 2: Client Onboarding & Portfolio Sync
- **Action:** Create a Client in CRM.
- **Verification:** Ensure the client document is immediately visible in:
  - CRM Client Lists
  - Client360 ViewModel
  - Client Portal
  - Executive Dashboard

### Test 3: Demand Intake & Marketplace Broadcast
- **Action:** Client creates a hiring Requirement from the Portal.
- **Verification:** Ensure the requirement is fully processed in:
  - CRM Requirements View
  - OS Jobs View
  - Vendor Marketplace Broadcast Queue
  - AI Matching & Evaluation Engine
  - Founder Dashboard

### Test 4: Supply Sourcing & Talent Matching
- **Action:** Vendor uploads a Candidate Bench spreadsheet/file.
- **Verification:** Ensure the candidate is registered and evaluated:
  - Candidate visible in Vendor Workspace
  - Candidate synced instantly to CRM Candidates
  - Candidate360 view updated
  - AI Match Engine processes skills, scoring the candidate against active Requirements automatically

### Test 5: Talent Submission & Timeline Audit
- **Action:** Recruiter reviews matched candidate and submits them to the Client.
- **Verification:** Ensure the following atomic actions execute:
  - `submissions` transaction created in SSOT
  - Vendor metrics and Client queues updated
  - Candidate Timeline updated
  - Immutable ledger event (`CANDIDATE_SUBMITTED`) written to `system_events`

### Test 6: Full staff-to-hire Lifecycle
- **Action:** Complete the progressive staffing lifecycle:
  `Requirement` ➔ `Broadcast` ➔ `Vendor Response` ➔ `Candidate Matching` ➔ `Submission` ➔ `Interview` ➔ `Offer` ➔ `Placement` ➔ `Invoice` ➔ `Payment`.
- **Verification:** Ensure every transition updates dashboards, renders inside timelines across respective CRM and OS portals, and generates immutable, auditable events inside the company ledger.




---

# HireNestOS v2 — AI Staffing Operating System

Based on the strategic vision, HireNestOS is evolving from a traditional CRM into a comprehensive **AI Staffing Operating System**. The CRM is now just one module within a broader, autonomous enterprise architecture.

## 1. Communication-First Foundation
The architecture is fundamentally shifted away from direct, hard-coded integrations (e.g. Gmail as a standalone feature) to a provider-agnostic **Communication Gateway**:
* **Providers:** Gmail, Outlook, LinkedIn, WhatsApp, SMS, Voice, Telegram all implement a common `CommunicationProvider` interface.
* **Unified Conversation Model:** All interactions land in a normalized `conversations` and `messages` collection (Unified Inbox).
* **AI Memory:** The AI agent analyzes every thread to construct context, updating memory with intent, entities, sentiment, urgency, preferred channels, and next actions.
* **Event Bus:** All message events (e.g., `MESSAGE_RECEIVED`, `MESSAGE_SENT`) flow into `system_events` where autonomous agents subscribe and act.

## 2. Autonomous Agent Runtime
Hard-coded workflows are replaced by specialized AI Agents executing in a central Orchestration layer:
* **Business Development Agent:** Outreaches on LinkedIn/Email, enriches contacts, sets up meetings.
* **AI Email Agent (Outreach Engine):** Crafts highly personalized emails based on prompt templates, company history, available bench, etc. Wait-states use an autonomous Sequence Engine instead of fixed campaigns.
* **Recruiter Agent:** Reads incoming requirements, searches across Internal/Bench/LinkedIn, ranks candidates, and coordinates submissions.
* **Vendor Agent:** Parses inbound bench emails, checks duplicates, extracts skills/availability/rate, and auto-matches to active requirements.
* **Client Agent:** Generates intelligent briefing documents before meetings, aggregating company history, news, past submissions, and revenue details.
* **CEO/Founder Agent:** Summarizes the enterprise’s pulse each morning—highlighting revenue pipeline, critical blockages, at-risk clients, and key metrics.

## 3. Communication OS Integration
No action is triggered manually unless necessary. If a client emails "Need 4 Java Developers", the **AI Intent Engine**:
1. Classifies the intent as `Need Candidates`.
2. Extracts entities (Java, 4).
3. Emits `RequirementCreated` event to the Event Bus.
4. The Recruiter and Vendor Agents wake up to fulfill the demand.
5. All operations are strictly audited via the immutable `system_events` ledger and persisted centrally in Firestore (SSOT).

## 4. Platform Intelligence & Orchestration (HireNestOS Phase 3)
HireNestOS is transitioning from reactive agent workflows to a deeply orchestrated platform model. Rather than hard-coded interactions, the system relies on dynamic planning and orchestration.

*   **Workflow Engine:** Every business process is modeled as an event-driven state machine. When an intent is detected (e.g., "Need Candidates"), the Workflow Engine drives a configurable sequence of actions (Search -> Match -> Create Submission -> Email -> Wait -> Schedule).
*   **Outreach OS:** The communication layer extends into an autonomous sales execution engine. Outreach consists of multi-channel sequences, dynamic delays, automatic reply detection, and AI-driven personalization, pausing instantly upon engagement.
*   **AI Planner:** For complex requests, the AI Planner breaks down high-level intents (e.g., "Need 6 React Developers") into achievable goals and discrete tasks, distributing work among specialized agents rather than relying on a single monolithic prompt.
*   **Agent Registry:** Agents are registered dynamically with explicit manifests outlining their capabilities, permissions, subscribed events, and health status. The Planner dynamically discovers the right agent to execute a task.
*   **Knowledge Graph (Future):** Isolated entity records are linked into a global graph, mapping relationships between companies, hiring managers, vendors, candidates, and financial outcomes, unlocking deep relational intelligence (e.g. "Which vendor closes the most Java roles?").
*   **Multi-Model Router:** AI requests are intelligently routed based on cost, latency, and capability constraints—favoring fast/local models for simple tasks (parsing, intent) and reasoning-heavy models (Gemini Pro/GPT-5.5) for complex planning and generation.

## 5. Platform Hardening & Governance (HireNestOS Phase 4)
As the architecture shifts to a platform model, the focus moves from adding features to hardening the **AI Operating System Kernel**.

*   **OS SDK:** Internal services, plugins, and modules interact with the platform through a unified `@hirenest/os-sdk` (Events, Messaging, Memory, Workflow, Agents, Observability) rather than raw Firestore or Pub/Sub clients. This abstracts the data layer.
*   **AI Control Plane:** An observability layer tracking Agent execution, Planner decisions, Workflow states, failed tasks, token usage, model latency, and human overrides. Provides visibility into the autonomous engine.
*   **Task Queue & Scheduler:** Agents do not execute work synchronously. The Planner distributes work into a Task Queue (supporting retries, back-pressure, concurrency control, and rate limiting).
*   **Memory Hierarchy:** Context is separated into Global, Tenant, Company, Contact, Conversation, Workflow, Agent, and Session memory layers to prevent context pollution.
*   **AI Skills Framework:** Instead of monolithic agents, agents compose reusable *Skills* (e.g., Search Candidates, Extract Skills, Generate Proposal).
*   **Policy-Based Governance:** All actions are gated by enterprise policies (e.g., Approval thresholds, PII restrictions, Maximum outreach limits) ensuring human-in-the-loop compliance where required.

## 6. Enterprise Extensions & Platform Kernel (HireNestOS Phase 5)
HireNestOS is fundamentally shifting from a service-oriented architecture to a **Platform-Centric** ecosystem. The system is divided into a stable, hardened OS Kernel and an extensible Marketplace.

*   **Platform Manifest:** Every deployment exposes a configuration manifest detailing the version, active modules, installed extensions, registered skills, and enabled policies.
*   **Extension Framework:** Everything outside the kernel (CRM, ATS, Vendor Portal) registers as an Extension via the `ExtensionRegistry`. Extensions declare capabilities rather than explicit implementations.
*   **Enterprise Search:** A unified search layer aggregates Candidates, Requirements, Companies, Communications, and Knowledge, decoupling the search intent from the underlying vector/database implementation.
*   **Digital Twin & State:** Every business object (Requirement, Candidate) has an AI-aware 'Digital Twin' representation computing risk, recommendations, and operational health in real-time.
*   **Asset Versioning:** Prompts, Skills, Workflows, and Policies are versioned as deployable assets, ensuring reproducible AI behavior and auditability.
*   **Metrics Engine:** Comprehensive telemetry captures not just AI usage (tokens, cost, human overrides), but operational KPIs (placements, response times, quality ratios).

## 7. Universal Digital Twin & Decision Engine (HireNestOS Phase 6)
HireNestOS evolves from "AI in every screen" to "AI running the business."

*   **Universal Digital Twin Framework:** Replaces separate AI representations with a unified interface for every entity (Candidate, Requirement, Company, Vendor, Recruiter, Client, Placement). Every twin exposes: Executive Summary, Health Score, Risks, Opportunities, Predictions, Recommended Actions, Timeline, and AI Memory.
*   **Decision Engine:** AI shifts from providing insights to recommending actionable decisions (e.g., "Health: 62% -> Risk: No submissions in 48hrs -> Action: Assign Vendor X"). Humans approve recommendations rather than assembling them manually.
*   **AI Command Center:** A single role-aware 'HireNest AI' replaces fragmented copilots. The same underlying reasoning engine serves the Recruiter, Vendor, Client, and Founder based on RBAC.
*   **Predictive Intelligence:** Digital Twins calculate forward-looking metrics (e.g., Offer Probability, Fill Probability, Churn Probability) to turn the platform from reactive to predictive.
*   **AI Work Queue:** An operational, role-based queue surfaces priority tasks (e.g., "Client waiting 18 hours") instead of generic notifications.
*   **Enterprise APIs & Plugin Ecosystem:** Stable APIs (Candidate API, Workflow API, Search API) enable a rich ecosystem of external integrations (Teams, SAP, Workday) without modifying the OS Kernel.

## 8. Platform Constitution & End-to-End Workflows (HireNestOS Phase 7)
HireNestOS operates under a strict Platform Constitution to ensure enterprise readiness and scalable architecture:

**The Platform Constitution**
*   **Law 1 — Single Source of Truth:** No duplicate business data.
*   **Law 2 — Event First:** Every state change emits a domain event.
*   **Law 3 — SDK Only:** Modules never access infrastructure directly.
*   **Law 4 — AI is Advisory by Default:** High-impact actions require configurable approval unless explicitly permitted by policy.
*   **Law 5 — Every Entity Has a Digital Twin:** All core business entities expose the same AI contract.
*   **Law 6 — Workflow Before Code:** Business processes are modelled as workflows rather than embedded in application logic.
*   **Law 7 — Everything is Observable:** Every AI decision, workflow, and business event is measurable and auditable.
*   **Law 8 — Capability over Implementation:** The planner requests capabilities; agents, skills, and extensions provide them.
*   **Law 9 — Multi-tenant by Design:** Every service, event, workflow, and memory operation executes within tenant boundaries.
*   **Law 10 — Business Outcomes First:** Success is measured by placements, revenue, time-to-fill, client satisfaction, and recruiter productivity—not by the number of AI actions.

**Core IT Staffing Workflows**
1. **Client Acquisition:** Lead Gen -> Cold Outreach -> Discovery -> MSA -> Onboarding.
2. **Requirement Intake:** Validation -> Skill Taxonomy -> Assignment.
3. **Requirement Distribution:** Internal + Vendors + Bench based on SLA and load balancing.
4. **Candidate Sourcing:** Internal, Bench, Boards, Referrals into Talent Pool.
5. **Resume Processing:** AI Parse -> Skill Extract -> Twin Generation -> Embedding -> Deduplication.
6. **AI Matching Engine:** Multi-factor scoring (Skill, Experience, Domain, Budget, Availability).
7. **Recruiter Screening:** Availability, CTC, Rate, Communication verification.
8. **Candidate Submission:** AI-generated Submission Packets with consent tracking.
9. **Interview Management:** Scheduling, Feedback, AI Transcript Summaries.
10. **Offer Management:** Negotiation, BGV, joining confirmation.
11. **Onboarding & Joining:** Document collection, Timesheet generation, Invoicing.
12. **Post Placement:** SLA Checks, Satisfaction, Retention Prediction.

These workflows are mapped explicitly to the dedicated internal Personas: Account Managers, Recruiters, Vendors, Finance, and the unified HireNestOS AI.

## 9. Enterprise Execution & Integration (HireNestOS Phase 7)
The final architectural shift moves HireNestOS from an application to a comprehensive Workforce Intelligence Operating System governed by strict execution paths:

*   **Phase 7.1 - Workflow Engine (Execution Core):** Every business process executes through a state machine supporting SLA timers, human/AI tasks, retry logic, and audit trails. UI components do not bypass the engine.
*   **Phase 7.2 - Enterprise API Gateway:** A versioned API layer (`/api/v1/crm`, `/api/v1/requirements`, etc.) supporting REST, Webhooks, and OAuth.
*   **Phase 7.3 - Event Bus:** Standardization of all domain events (`LeadCreated`, `CandidateMatched`) containing Correlation ID, Tenant ID, and version metadata.
*   **Phase 7.4 - Knowledge Graph:** Entity relationship modeling for predictive intelligence.
*   **Phase 7.5 - Automation Studio:** No-code triggers and actions.
*   **Phase 7.6 - AI Orchestrator:** Dynamic coordination of specialized agents rather than independent execution.
*   **Phase 7.7 - Billing & Finance:** Operational lifecycle completion (Timesheets, Invoices, Incentives).
*   **Phase 7.8 - Integration Hub:** Connectors for third-party systems (Workday, Bullhorn, SAP).
*   **Phase 7.9 - Observability:** Enterprise telemetry (Workflow duration, Token usage, SLA compliance).
*   **Phase 7.10 - Multi-Tenant Hardening:** RBAC, Tenant isolation, Branch hierarchy.

## 10. Marketing & Content Intelligence (HireNestOS)
The platform includes an AI-driven Marketing Studio to attract IT staffing clients and vendors:
*   **AI Campaign Architect:** Generates professional, high-converting copy targeting clients (e.g. for requirement acquisition) and vendors (for onboarding).
*   **Revenue Attribution:** Tracks the entire funnel from content views and leads captured down to opportunities and closed revenue. 
*   **Data-Driven Strategies:** Identifies which audience groups (Enterprise Clients vs Staffing Vendors) generate the most pipeline value, ensuring marketing efforts align with business outcomes.

## 11. AI Orchestration Layer (Ruflo)
The HireNest OS intelligence layer uses **Ruflo** (https://github.com/ruvnet/ruflo) as its primary Agent Meta-Harness.
*   **Agent Meta-Harness:** Rather than running isolated agents, Ruflo provisions multi-player swarms for complex staffing workflows.
*   **Integration Point:** The `RufloOrchestrator` listens to the HireNest `system_events` stream (via EventBus) and dynamically allocates agents from the Ruflo Swarm (e.g., Client Agent, Vendor Agent, Orchestrator Agent).
*   **Self-Learning Memory:** Ruflo's adaptive memory captures successful matches and candidate feedback, continually optimizing the matching engine without altering the core database schema.
