import { getAdminDb } from "../../utils/firebaseAdmin.js";
import { CandidateScreeningReport } from "./ScreeningReportService.js";

export interface ScreeningAuditEvent {
  candidateId: string;
  requirementId?: string;
  eventType: "SCREENED" | "PASSED" | "REVIEW" | "REJECTED" | "SCREENING_OVERRIDE" | "SUBMITTED" | "CLIENT_REJECTED";
  decision: string;
  reason: string;
  score: number;
  actor: string;
  timestamp: string;
  screeningVersion: string;
  overrideMetadata?: {
    overrideReason: string;
    overrideBy: string;
    overrideAt: string;
  };
}

export class ScreeningAuditService {
  /**
   * Logs a screening report and generates audit events in Firestore
   */
  static async recordScreening(
    candidateId: string,
    report: CandidateScreeningReport,
    actor: string = "system"
  ): Promise<void> {
    try {
      const db = getAdminDb();
      const timestamp = new Date().toISOString();

      // 1. Save Full Screening Report
      await db.collection("candidate_screening_reports").doc(candidateId).set({
        ...report,
        candidateId,
        updatedAt: timestamp
      }, { merge: true });

      // 2. Save Screening Event to candidate_screening_events
      const eventDocRef = db.collection("candidate_screening_events").doc();
      const auditEvent: ScreeningAuditEvent = {
        candidateId,
        requirementId: report.requirementId,
        eventType: report.decision.status === "PASS" ? "PASSED" : (report.decision.status === "REJECT" ? "REJECTED" : "REVIEW"),
        decision: report.decision.status,
        reason: report.decision.primaryReason,
        score: report.overallScore,
        actor,
        timestamp,
        screeningVersion: report.screeningVersion
      };

      await eventDocRef.set({
        id: eventDocRef.id,
        ...auditEvent
      });

      // 3. Emit to Immutable Company Ledger system_events
      const ledgerDocRef = db.collection("system_events").doc();
      await ledgerDocRef.set({
        id: ledgerDocRef.id,
        type: `CANDIDATE_SCREENING_${report.decision.status}`,
        entityType: "candidate",
        entityId: candidateId,
        performedBy: actor,
        timestamp,
        metadata: {
          score: report.overallScore,
          decision: report.decision.status,
          totalExperience: report.totalExperience.formatted,
          relevantExperience: report.relevantExperience.formatted,
          reason: report.decision.primaryReason,
          requirementId: report.requirementId
        }
      });
    } catch (error) {
      console.warn("[ScreeningAuditService] Failed to record screening event:", error);
    }
  }

  /**
   * Records an admin override event for a candidate in REVIEW state
   */
  static async recordOverride(
    candidateId: string,
    requirementId: string,
    overrideReason: string,
    overrideBy: string
  ): Promise<void> {
    const db = getAdminDb();
    const timestamp = new Date().toISOString();

    const eventDocRef = db.collection("candidate_screening_events").doc();
    const auditEvent: ScreeningAuditEvent = {
      candidateId,
      requirementId,
      eventType: "SCREENING_OVERRIDE",
      decision: "OVERRIDDEN_TO_PASS",
      reason: overrideReason,
      score: 100,
      actor: overrideBy,
      timestamp,
      screeningVersion: "v1.0.0-pure-deterministic",
      overrideMetadata: {
        overrideReason,
        overrideBy,
        overrideAt: timestamp
      }
    };

    await eventDocRef.set({
      id: eventDocRef.id,
      ...auditEvent
    });

    const ledgerDocRef = db.collection("system_events").doc();
    await ledgerDocRef.set({
      id: ledgerDocRef.id,
      type: "SCREENING_OVERRIDE",
      entityType: "candidate",
      entityId: candidateId,
      performedBy: overrideBy,
      timestamp,
      metadata: {
        requirementId,
        overrideReason,
        overrideBy,
        action: "Admin override for submission gate."
      }
    });
  }
}
