import { submissionRepository } from "../repositories/SubmissionRepository.js";
import { getAdminDb } from "../utils/firebaseAdmin.js";
import { DomainEventPublisher } from "../events/DomainEventPublisher.js";
import { ScreeningAuditService } from "./screening/ScreeningAuditService.js";
import { userActivityService } from "./UserActivityService.js";
import * as crypto from "crypto";

export class SubmissionService {
  async getById(id: string, userContext?: any) {
    const submission = await submissionRepository.findById(id);
    if (!submission) return null;
    if (userContext) {
      if (userContext.userId === "executive-root") return submission;
      if (userContext.organizationId && submission.organizationId && submission.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && userContext.vendorId && submission.vendorId !== userContext.vendorId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && submission.clientId !== userContext.clientId) {
        return null;
      }
    }
    return submission;
  }

  async list(userContext?: any) {
    let list = await submissionRepository.findAll();
    if (userContext) {
      list = list.filter((item: any) => {
        if (userContext.userId === "executive-root") return true;
        
        // Tenant isolation
        if (userContext.organizationId && item.organizationId && item.organizationId !== userContext.organizationId) {
          return false;
        }

        // Role/Workspace-specific filtering
        if (userContext.workspace === "Vendor" && userContext.vendorId) {
          return item.vendorId === userContext.vendorId;
        }

        if (userContext.workspace === "Client" && userContext.clientId) {
          return item.clientId === userContext.clientId;
        }

        return true;
      });
    }
    return list;
  }

  async create(data: any, performedBy: string = 'System', userContext?: any) {
    const db = getAdminDb();

    // Enforce requirementId presence and validity
    if (!data.requirementId || data.requirementId === "UNKNOWN" || data.requirementId === "POOL" || data.requirementId === "GENERAL") {
      throw new Error("Submission Block: Every submission MUST have a valid requirementId.");
    }
    const reqDoc = await db.collection("requirements").doc(data.requirementId).get();
    if (!reqDoc.exists) {
      throw new Error(`Submission Block: Provided requirementId "${data.requirementId}" is invalid or does not exist.`);
    }

    // Submission Gate Validation (Phase 19)
    if (data.candidateId) {
      try {
        const candDoc = await db.collection("candidates").doc(data.candidateId).get();
        if (candDoc.exists) {
          const cand = candDoc.data();
          const screening = cand?.screeningResult;
          if (screening) {
            if (screening.status === "REJECT" && !data.overrideReason) {
              throw new Error(`Submission Gate Block: Candidate failed strict profile screening (${screening.summary || 'Technical qualifications benchmark not met'}). Admin override required.`);
            }

            if (data.overrideReason) {
              await ScreeningAuditService.recordOverride(
                data.candidateId,
                data.requirementId || "GENERAL",
                data.overrideReason,
                performedBy
              );

              await userActivityService.logActivity({
                userId: userContext?.userId || userContext?.uid || performedBy || "System",
                userEmail: userContext?.email || "system@hirenestworkforce.com",
                userRole: userContext?.role || "Admin",
                eventType: "SCREENING_OVERRIDE",
                description: `Screening override applied for candidate ${data.candidateId} on requirement ${data.requirementId || 'GENERAL'}`,
                organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
                metadata: {
                  candidateId: data.candidateId,
                  requirementId: data.requirementId || "GENERAL",
                  overrideReason: data.overrideReason,
                }
              });
            }
          }
        }
      } catch (gateErr: any) {
        if (gateErr.message?.includes("Submission Gate Block")) {
          throw gateErr;
        }
      }
    }

    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      vendorId: data.vendorId || userContext?.vendorId || '',
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await submissionRepository.create(item, performedBy);

    await userActivityService.logActivity({
      userId: userContext?.userId || userContext?.uid || performedBy || "System",
      userEmail: userContext?.email || "system@hirenestworkforce.com",
      userRole: userContext?.role || "Admin",
      eventType: "SUBMISSION",
      description: `Candidate ${data.candidateId} was successfully submitted to requirement ${data.requirementId}.`,
      organizationId: created.organizationId || "bootstrap-org",
      metadata: {
        submissionId: id,
        candidateId: data.candidateId,
        requirementId: data.requirementId,
      }
    });

    await DomainEventPublisher.publishDomainEvent({
      type: "CANDIDATE_SUBMITTED",
      aggregateType: "Submission",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || data.vendorId || "bootstrap-org",
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: userContext?.workspace === "Vendor" ? "OS" : "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    const existing = await submissionRepository.findById(id);
    await submissionRepository.update(id, cleanUpdates, performedBy);
    const updated = await submissionRepository.findById(id);

    if (updated) {
      // Trigger CLIENT_FEEDBACK_RECEIVED if client feedback fields are added or updated
      if (
        (updates.feedback !== undefined && (!existing || existing.feedback !== updates.feedback)) ||
        (updates.clientFeedback !== undefined && (!existing || existing.clientFeedback !== updates.clientFeedback)) ||
        (updates.rating !== undefined && (!existing || existing.rating !== updates.rating))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CLIENT_FEEDBACK_RECEIVED",
          aggregateType: "Submission",
          aggregateId: id,
          organizationId: updated.organizationId || updated.vendorId || "default",
          actorId: performedBy,
          actorRole: "Client",
          sourceApp: "OS",
          sourceWorkspace: "Client",
          payload: updated
        });
      }

      // Trigger SUBMISSION_WITHDRAWN if status changes to withdrawn
      if (updates.status === "withdrawn" && (!existing || existing.status !== "withdrawn")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "SUBMISSION_WITHDRAWN",
          aggregateType: "Submission",
          aggregateId: id,
          organizationId: updated.organizationId || updated.vendorId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }
    }
  }

  async delete(id: string, performedBy: string = 'System') {
    const existing = await submissionRepository.findById(id);
    await submissionRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "SUBMISSION_WITHDRAWN",
        aggregateType: "Submission",
        aggregateId: id,
        organizationId: existing.organizationId || existing.vendorId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: { id, deleted: true }
      });
    }
  }
}

export const submissionService = new SubmissionService();
