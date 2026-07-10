# HireNest Enterprise Data Platform
## Firestore Schema Governance & Consolidation Plan — Version 1.0 (RC-1)

Status: **FROZEN / RC-1 ACTIVE**
Role Permissions & Isolation: **Enforced**
Single Source of Truth: **Active**

---

## 1. High-Level Architectural Blueprint

In HireNest Enterprise, neither CRM (System of Execution) nor HireNest OS (System of Intelligence) "owns" any business collections. Instead, both are clients consuming a shared **Enterprise Data Platform** backed by a single Firestore `(default)` database instance.

```text
                    Firestore (default)
            ===================================
              ENTERPRISE DATA PLATFORM (SSOT)
            ===================================
                             │
      ───────────────────────┼───────────────────────
                             │
                Immutable Company Ledger
                (system_events + workflows)
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
   HireNest CRM                             HireNest OS
System of Execution                    System of Intelligence
(Humans do transaction work)           (AI department runtime)
```

### Core Architecture Laws:
1. **The Single Job Principle**: A "Job" does not exist separate from a "Requirement". The `requirements` collection is the unified, single demand document. Its fields (e.g., `visibility.vendor`, `visibility.public`, `status`, `broadcast.status`) govern client, recruiter, and vendor marketplace access.
2. **The Pipeline Principle**: A candidate's active stage or state never belongs in the `candidates` document. The candidate is a reusable talent entity. The stage, interview progress, and SLA targets belong strictly inside the `submissions` collection.
3. **Event-Driven Action Engine**: Downstream systems, notifications, matched queues, or partner updates are never called directly by the originating UI. Transactions update the core collection and emit a standard event to the `system_events` (Immutable Company Ledger). Background workers or subscribers react to these events.

---

## 2. Platform Tiering Strategy

The Firestore collections are structured into four clean tiers to reduce schema drift and consolidate overlapping records:

| Tier | Name | Description | Status |
|---|---|---|---|
| **Tier 1** | **Business Domain** | Canonical operational objects (SSOT) | **Permanent / Keep** |
| **Tier 2** | **OS Intelligence** | AI, mail processing, workflows, and task pipelines | **Keep** |
| **Tier 3** | **Cleaned Up / Consolidated** | Overlapping or legacy collections | **Deprecated / Do Not Write** |
| **Tier 4** | **Archive** | Rotated historical records | **Active** |

---

## 3. Tier 1: Business Domain Collections (Canonical SSOT)

These collections represent the stable business model. All modifications must be written via transaction-safe repository patterns.

### 1. `organizations`
* **Purpose**: Tenant and organization definition.
* **Fields**:
  * `id` (string): Unique organization ID.
  * `name` (string): Business/Company name.
  * `createdAt` (timestamp): Record creation time.
* **Events**: `ORGANIZATION_CREATED`

### 2. `users`
* **Purpose**: Authenticated user profiles with RBAC.
* **Fields**:
  * `id` (string): Auth UID matching Firebase Authentication.
  * `organizationId` (string): Partitioning key.
  * `email` (string): Workspace email.
  * `role` (string): `FOUNDER | ADMIN | RECRUITER | VENDOR | CLIENT`.
  * `name` (string): Full name of the user.
* **Events**: `USER_PROVISIONED`

### 3. `clients`
* **Purpose**: Master profiles of hiring corporate clients and registered vendors.
* **Fields**:
  * `id` (string): Unique client ID.
  * `organizationId` (string): Multi-tenant isolation.
  * `name` (string): Client company name.
  * `isVendor` (boolean): `true` if this client record represents a Vendor.
  * `tier` (string): e.g., `T1 | T2 | Preferred`.
  * `status` (string): `ACTIVE | INACTIVE`.
* **Events**: `CLIENT_CREATED`, `CLIENT_UPDATED`

### 4. `vendors`
* **Purpose**: Detailed staffing agencies and bench providers parameters.
* **Fields**:
  * `id` (string): Matches client/user mappings.
  * `organizationId` (string): Partitioning key.
  * `companyName` (string): Public company name.
  * `responseRate` (number): SLA metric tracker.
  * `performanceScore` (number): Integrated vendor score (out of 100).
* **Events**: `VENDOR_ONBOARDED`, `VENDOR_PERFORMANCE_UPDATED`

### 5. `requirements`
* **Purpose**: Master job/staffing demand record (The single job/requirement).
* **Fields**:
  * `id` (string): Canonical ID.
  * `organizationId` (string): Partitioning key.
  * `clientId` (string): Associated hiring client.
  * `title` (string): Job title.
  * `status` (string): `DRAFT | OPEN | CLOSED | FILLED`.
  * `pricing_data` (object): Includes `requirementType` (`C2C | FTE | C2H`).
  * `skills` (array of strings): Primary skill taxonomy.
  * `visibility` (object):
    * `public` (boolean): If open to public applications.
    * `vendors` (boolean): If broadcast to vendor marketplace.
    * `client` (boolean): If visible to client workspace.
  * `broadcast` (object):
    * `status` (string): `QUEUED | PROCESSING | COMPLETED | FAILED`.
    * `lastBroadcastAt` (timestamp): Track of last broadcast.
    * `jobId` (string): ID of active `broadcast_jobs` doc.
* **Events**: `REQUIREMENT_CREATED`, `REQUIREMENT_APPROVED`, `REQUIREMENT_BROADCAST_STARTED`, `REQUIREMENT_CLOSED`

### 6. `candidates`
* **Purpose**: Passive talent/bench profiles uploaded by vendors or recruiters.
* **Fields**:
  * `id` (string): Unique candidate identifier.
  * `organizationId` (string): Partitioning key.
  * `vendorId` (string): Owner vendor profile, if submitted via vendor bench.
  * `name` (string): Name (isolated under PII rules).
  * `email` (string): Email (isolated under PII rules).
  * `skills` (array of strings): Parsed skill taxonomy.
* **Events**: `CANDIDATE_IMPORTED`, `CANDIDATE_SKILLS_PARSED`

### 7. `submissions`
* **Purpose**: Direct association between a candidate and a requirement. Tracks recruitment pipelines.
* **Fields**:
  * `id` (string): Assignment link.
  * `organizationId` (string): Partitioning key.
  * `requirementId` (string): Targeted job.
  * `candidateId` (string): Active talent.
  * `status` (string): `SUBMITTED | SCREENING | INTERVIEWING | OFFER_EXTENDED | PLACED | REJECTED`.
  * `history` (array of events): Lifecycle transition tracking.
  * `slaDeadline` (timestamp): Time before escalation.
* **Events**: `CANDIDATE_SUBMITTED`, `SUBMISSION_STAGE_UPDATED`

### 8. `interviews`
* **Purpose**: Active calendar and meeting logs.
* **Fields**:
  * `id` (string): Unique identifier.
  * `submissionId` (string): Associated application.
  * `scheduledAt` (timestamp): Session time.
  * `feedbackId` (string): Link to scorecard feedback.
* **Events**: `INTERVIEW_SCHEDULED`, `INTERVIEW_COMPLETED`

### 9. `offers`
* **Purpose**: Financial/contract details extended to candidate.
* **Fields**:
  * `id` (string): Offer ID.
  * `submissionId` (string): Source application.
  * `salaryRate` (number): Compensation value.
  * `status` (string): `PENDING | ACCEPTED | DECLINED`.
* **Events**: `OFFER_ISSUED`, `OFFER_ACCEPTED`

### 10. `placements`
* **Purpose**: Final transaction state once candidate is joined.
* **Fields**:
  * `id` (string): Placement ID.
  * `submissionId` (string): Source application.
  * `startDate` (string): Joining date.
  * `marginRate` (number): Business revenue model margin.
* **Events**: `PLACEMENT_CREATED`, `REVENUE_BLOCKED_RESOLVED`

### 11. `invoices`
* **Purpose**: Financial collection documents.
* **Fields**:
  * `id` (string): Invoice ID.
  * `placementId` (string): Associated placement.
  * `amount` (number): Due total.
  * `status` (string): `UNPAID | PAID | OVERDUE`.
* **Events**: `INVOICE_GENERATED`, `PAYMENT_RECEIVED`

### 12. `payments`
* **Purpose**: Ledger of client disbursements and revenue realized.
* **Fields**:
  * `id` (string): Record ID.
  * `invoiceId` (string): Targeted collection doc.
  * `amount` (number): Disbursed total.
* **Events**: `PAYMENT_RECORDED`

### 13. `system_events`
* **Purpose**: Immutable ledger (Company Ledger). Key-stone collection for audits and background workflows.
* **Fields**:
  * `id` (string): Unique event ID.
  * `organizationId` (string): Multi-tenant isolation.
  * `type` (string): Action type (e.g., `REQUIREMENT_BROADCAST_STARTED`).
  * `aggregateType` (string): Target collection (e.g., `Requirement`).
  * `aggregateId` (string): Target document (e.g., `req-001`).
  * `actorId` (string): Action executor.
  * `actorRole` (string): Performed role context.
  * `sourceApp` (string): `CRM | OS`.
  * `sourceWorkspace` (string): `Vendor | Client | Recruiter | Admin`.
  * `payload` (map): Structured change parameters.
  * `timestamp` (string): ISO representation.
* **Events**: Append-only (immutable).

### 14. `notifications`
* **Purpose**: Human inbox alert payloads.
* **Fields**:
  * `id` (string): Notification ID.
  * `userId` (string): Receiving user target.
  * `title` (string): Alert title.
  * `body` (string): Alert message details.
  * `read` (boolean): `true | false`.
* **Events**: `NOTIFICATION_DISPATCHED`

---

## 4. Tier 2: OS Intelligence & Background Collections

These drive the AI departments, email integrations, and workflows of HireNest OS.

### Category A: Communication & Ingestion Hub
* **`gmail_connections`**: Server-side OAuth bindings and user tokens (excluding client-managed cookies).
* **`gmail_watch`**: Active Pub/Sub push notification targets from Google Webhooks.
* **`mail_messages`**: Master emails processed from Gmail, linked to thread timelines.
* **`mail_events`**: Chronological email triggers and ingestion logs.
* **`token_vault`**: Highly restricted repository of service account keys and client credential hashes.

### Category B: AI Matching Core
* **`requirement_match_index`**: Vector ratings, skill comparisons, and automated scores matching candidates to requirements.
* **`planner_tasks`**: Autonomous jobs curated for recruiters and BDM offices.
* **`work_items`**: Actionable tasks assigned to background queue processors.

### Category C: Event & Workflow Orchestration
* **`workflow_definitions`**: Business models mapping SLA triggers, follow-up chains, and escalations.
* **`workflow_rules`**: Rules executing tasks based on transaction events.
* **`system_event_subscriptions`**: Subscribed background listeners waiting on `system_events`.

### Category D: Platform Observability
* **`system_runtime`**: Health telemetry of background agents, queue depths, and runtimes.
* **`system_logs`**: Consolidated platform warning and error codes.
* **`system_health`**: Active indicator of external dependency APIs (WhatsApp API, Gmail API).

---

## 5. Tier 3: Deprecated Collections (Consolidation Target)

To prevent schema drift, the following collections are **DEPRECATED** and must not be written to by any new endpoints. Their workloads have been folded into the primary SSOT:

| Deprecated Collection | Replacement Target | Reason |
|---|---|---|
| `requirements_public` | `requirements` (filter `visibility.public == true`) | Avoid duplicate job requirements. |
| `requirements_private` | `requirements` (filter `visibility.vendor == true`) | Avoid duplicate job requirements. |
| `workflowEvents` | `system_events` | Unified under the Company Ledger. |
| `execution_events` | `system_events` | Unified under the Company Ledger. |
| `intake_events` | `system_events` | Unified under the Company Ledger. |
| `intake_audit` | `system_events` | Unified under the Company Ledger. |
| `validation_results` | `system_runtime` | Merged into general system validation metrics. |
| `oauth_debug` | `system_logs` | Removed development footprint. |
| `error_monitoring_logs` | `system_logs` | Unified logging system. |

---

## 6. Three New Crucial Integration Collections (RC-2 Ready)

These are added to support the resilient asynchronous broadcast engine and multi-channel validation:

### 1. `broadcast_jobs`
* **Purpose**: Tracks long-running, multi-channel automated requirement broadcast jobs.
* **Fields**:
  * `id` (string): Master job ID.
  * `requirementId` (string): Broadcast requirement.
  * `status` (string): `QUEUED | PROCESSING | COMPLETED | FAILED`.
  * `targetVendors` (number): Target audience.
  * `settings` (map): Config for LinkedIn, WhatsApp, Portal, and Email.
  * `error` (string): Handled stack trace if failed.

### 2. `broadcast_deliveries`
* **Purpose**: Individual multi-channel logs tracing every single vendor/channel message.
* **Fields**:
  * `id` (string): Unique log item.
  * `jobId` (string): Parent `broadcast_jobs` reference.
  * `vendorId` (string): Targeted vendor.
  * `channel` (string): `portal | email | whatsapp | linkedin`.
  * `status` (string): `sent | delivered | failed`.

### 3. `integration_status`
* **Purpose**: Enterprise health-checks for crucial business system channels.
* **Fields**:
  * `id` (string): Channel name (e.g., `whatsapp_api`, `gmail_sprint_1`).
  * `status` (string): `ONLINE | OFFLINE | CREDENTIAL_EXPIRED`.
  * `lastCheckedAt` (timestamp): Telemetry sync time.

---

## 7. Firestore Indexes Blueprint

```javascript
// Index 1: Single requirement queries for Marketplace portals
Collection: requirements
Fields: organizationId ASC, status ASC, "visibility.vendors" ASC

// Index 2: Candidate search filters
Collection: candidates
Fields: organizationId ASC, vendorId ASC, skills ARRAY

// Index 3: Submission SLA dashboard trackers
Collection: submissions
Fields: organizationId ASC, status ASC, slaDeadline ASC

// Index 4: Multi-tenant audit trail logs
Collection: system_events
Fields: organizationId ASC, timestamp DESC
```

---

## 8. Rule Implementation Guidelines
Every repository read/write must proceed with the following ABAC/Zero-Trust security boundaries:
* **Create operations**: Verify complete size match to block shadow properties. E.g. `incoming().keys().size() == N`.
* **Update operations**: Restrict with `affectedKeys().hasOnly([...])` to split updates into highly specific actions.
* **List operations**: Never trust the client. Rule must evaluate `resource.data` directly (e.g., `resource.data.organizationId == request.auth.token.organizationId`).
