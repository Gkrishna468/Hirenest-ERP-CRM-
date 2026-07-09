import { candidateRepository } from "../repositories/CandidateRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class CandidateService {
  async getById(id: string, userContext?: any) {
    const candidate = await candidateRepository.findById(id);
    if (!candidate) return null;
    if (userContext) {
      if (userContext.userId === "executive-root") return candidate;
      if (userContext.organizationId && candidate.organizationId && candidate.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && userContext.vendorId && candidate.vendorId !== userContext.vendorId) {
        return null;
      }
    }
    return candidate;
  }

  async list(userContext?: any) {
    let list = await candidateRepository.findAll();
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

    const created = await candidateRepository.create(item, performedBy);

    // Publish CANDIDATE_CREATED
    await DomainEventPublisher.publishDomainEvent({
      type: "CANDIDATE_CREATED",
      aggregateType: "Candidate",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || data.vendorId || "bootstrap-org",
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: userContext?.workspace === "Vendor" ? "OS" : "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    // If imported, also publish CANDIDATE_IMPORTED
    if (data.source === "import" || data.imported === true || data.sourceWorkspace === "Vendor" || userContext?.workspace === "Vendor") {
      await DomainEventPublisher.publishDomainEvent({
        type: "CANDIDATE_IMPORTED",
        aggregateType: "Candidate",
        aggregateId: id,
        organizationId: created.organizationId || data.organizationId || data.vendorId || "bootstrap-org",
        actorId: performedBy,
        actorRole: userContext?.role || "Admin",
        sourceApp: userContext?.workspace === "Vendor" ? "OS" : "CRM",
        sourceWorkspace: userContext?.workspace || "Admin",
        payload: created
      });
    }

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    const existing = await candidateRepository.findById(id);
    await candidateRepository.update(id, cleanUpdates, performedBy);
    const updated = await candidateRepository.findById(id);

    if (updated) {
      await DomainEventPublisher.publishDomainEvent({
        type: "CANDIDATE_UPDATED",
        aggregateType: "Candidate",
        aggregateId: id,
        organizationId: updated.organizationId || updated.vendorId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: updated
      });

      // Trigger CANDIDATE_VALIDATED if validation details changed
      if (
        (updates.lastValidationTime !== undefined && (!existing || existing.lastValidationTime !== updates.lastValidationTime)) ||
        (updates.isValidated === true && (!existing || !existing.isValidated))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CANDIDATE_VALIDATED",
          aggregateType: "Candidate",
          aggregateId: id,
          organizationId: updated.organizationId || updated.vendorId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger CANDIDATE_ROTATED if rotation details changed
      if (
        (updates.lastRotationTime !== undefined && (!existing || existing.lastRotationTime !== updates.lastRotationTime)) ||
        (updates.rotated === true && (!existing || !existing.rotated))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CANDIDATE_ROTATED",
          aggregateType: "Candidate",
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
    const existing = await candidateRepository.findById(id);
    await candidateRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "CANDIDATE_ARCHIVED",
        aggregateType: "Candidate",
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

export const candidateService = new CandidateService();

