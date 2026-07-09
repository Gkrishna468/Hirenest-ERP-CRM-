import { submissionRepository } from "../repositories/SubmissionRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
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

