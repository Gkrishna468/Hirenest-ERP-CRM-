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

