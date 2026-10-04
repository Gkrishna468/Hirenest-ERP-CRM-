import { getAdminDb } from "../utils/firebaseAdmin";
import { accessControlService } from "./AccessControlService";

export interface Signal {
  id: string;
  entityType: "client" | "requirement" | "candidate" | "submission" | "deal";
  entityId: string;
  entityName: string;
  signalType: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reasonCodes: string[];
  metadata: Record<string, any>;
  createdAt: string;
}

export class SignalEngine {
  /**
   * Evaluates deterministic signals for authorized tenant & user scope
   */
  async evaluateSignals(organizationId: string, userContext?: any): Promise<Signal[]> {
    const db = getAdminDb();
    const signals: Signal[] = [];
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;

    // 1. Fetch authorized clients
    const clientsSnap = await db.collection("clients").where("organizationId", "==", organizationId).get();
    for (const doc of clientsSnap.docs) {
      const client = { id: doc.id, ...doc.data() } as any;
      const auth = await accessControlService.authorizeResourceAccess(userContext, "read", "client", client);
      if (!auth.allowed) continue;

      const lastInteraction = new Date(client.lastInteraction || client.updatedAt || client.createdAt || now).getTime();
      const ageDays = Math.floor((now - lastInteraction) / (24 * 60 * 60 * 1000));

      if (ageDays > 30) {
        signals.push({
          id: `sig-client-dormant-${client.id}`,
          entityType: "client",
          entityId: client.id,
          entityName: client.company || client.name || "Client",
          signalType: "CLIENT_DORMANT",
          priority: ageDays > 45 ? "CRITICAL" : "HIGH",
          reasonCodes: [`NO_INTERACTION_${ageDays}_DAYS`, "DORMANT_ACCOUNT"],
          metadata: { ageDays, lastInteraction: client.lastInteraction },
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Fetch authorized requirements
    const reqsSnap = await db.collection("requirements").where("organizationId", "==", organizationId).get();
    const subsSnap = await db.collection("submissions").where("organizationId", "==", organizationId).get();
    const submissionReqIds = new Set<string>();
    subsSnap.docs.forEach(d => {
      const sub = d.data();
      if (sub.requirementId || sub.jobId) {
        submissionReqIds.add(sub.requirementId || sub.jobId);
      }
    });

    for (const doc of reqsSnap.docs) {
      const req = { id: doc.id, ...doc.data() } as any;
      const auth = await accessControlService.authorizeResourceAccess(userContext, "read", "requirement", req);
      if (!auth.allowed) continue;

      const reqTime = new Date(req.createdAt || now).getTime();
      const ageHours = (now - reqTime) / (1000 * 60 * 60);
      const hasSubs = submissionReqIds.has(req.id);

      if (!hasSubs && ageHours > 48) {
        signals.push({
          id: `sig-req-nosub-${req.id}`,
          entityType: "requirement",
          entityId: req.id,
          entityName: req.title || req.role || "Requirement",
          signalType: "REQUIREMENT_NO_SUBMISSION",
          priority: ageHours > 96 ? "CRITICAL" : "HIGH",
          reasonCodes: [`CREATED_${Math.round(ageHours)}_HOURS_AGO`, "ZERO_SUBMISSIONS"],
          metadata: { ageHours, clientName: req.clientName },
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Fetch authorized submissions for pending client feedback
    for (const doc of subsSnap.docs) {
      const sub = { id: doc.id, ...doc.data() } as any;
      const auth = await accessControlService.authorizeResourceAccess(userContext, "read", "submission", sub);
      if (!auth.allowed) continue;

      if (sub.status === "Submitted" || sub.status === "Interviewing") {
        const subTime = new Date(sub.updatedAt || sub.createdAt || now).getTime();
        const daysInStage = Math.floor((now - subTime) / (24 * 60 * 60 * 1000));
        if (daysInStage >= 4) {
          signals.push({
            id: `sig-sub-feedback-${sub.id}`,
            entityType: "submission",
            entityId: sub.id,
            entityName: `${sub.candidateName || 'Candidate'} - ${sub.requirementTitle || 'Requirement'}`,
            signalType: "CANDIDATE_FEEDBACK_PENDING",
            priority: daysInStage > 7 ? "CRITICAL" : "HIGH",
            reasonCodes: [`PENDING_CLIENT_FEEDBACK_${daysInStage}_DAYS`, "PIPELINE_STALLED"],
            metadata: { daysInStage, status: sub.status },
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return signals;
  }
}

export const signalEngine = new SignalEngine();
