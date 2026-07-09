import { requirementRepository } from "../repositories/RequirementRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class RequirementService {
  async getById(id: string, userContext?: any) {
    const requirement = await requirementRepository.findById(id);
    if (!requirement) return null;
    if (userContext) {
      if (userContext.userId === "executive-root") return requirement;
      if (userContext.organizationId && requirement.organizationId && requirement.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && requirement.clientId !== userContext.clientId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && requirement.status !== "open" && requirement.status !== "broadcast" && requirement.broadcast !== true) {
        return null;
      }
    }
    return requirement;
  }

  async list(userContext?: any) {
    let list = await requirementRepository.findAll();
    if (userContext) {
      list = list.filter((item: any) => {
        if (userContext.userId === "executive-root") return true;
        
        // Tenant isolation
        if (userContext.organizationId && item.organizationId && item.organizationId !== userContext.organizationId) {
          return false;
        }

        // Role/Workspace-specific filtering
        if (userContext.workspace === "Client" && userContext.clientId) {
          return item.clientId === userContext.clientId || item.companyId === userContext.clientId || item.accountId === userContext.clientId;
        }

        if (userContext.workspace === "Vendor") {
          return item.status === "open" || item.broadcast === true || item.status === "broadcast";
        }

        return true;
      });
    }
    const compareDates = (aVal: any, bVal: any): number => {
      const getMs = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'string') {
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        if (val instanceof Date) {
          return val.getTime();
        }
        if (val && typeof val.toDate === 'function') {
          try {
            return val.toDate().getTime();
          } catch {
            // ignore
          }
        }
        if (val && typeof val.seconds === 'number') {
          return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
        }
        if (val && typeof val._seconds === 'number') {
          return val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000);
        }
        if (typeof val === 'number') {
          return val;
        }
        return 0;
      };
      return getMs(bVal) - getMs(aVal);
    };

    return list.sort((a: any, b: any) => compareDates(a.createdAt, b.createdAt));
  }

  async create(data: any, performedBy: string = 'System', userContext?: any) {
    const id = data.id || crypto.randomUUID();
    const requirement: any = {
      ...data,
      id,
      companyId: data.companyId || data.clientId || userContext?.clientId || '',
      clientId: data.clientId || userContext?.clientId || '',
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      title: data.title || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionsCount: 0,
      status: data.status || 'pending',
      approvalStatus: data.approvalStatus || 'pending',
    };

    const created = await requirementRepository.create(requirement, performedBy);

    await DomainEventPublisher.publishDomainEvent({
      type: "REQUIREMENT_CREATED",
      aggregateType: "Requirement",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || "bootstrap-org",
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: userContext?.workspace === "Client" ? "OS" : "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    // Legacy support
    if (updates.experienceRequired !== undefined) cleanUpdates.experience_required = updates.experienceRequired;
    if (updates.approvalStatus !== undefined) {
      cleanUpdates.approval_status = updates.approvalStatus;
      cleanUpdates.approvalStatus = updates.approvalStatus;
    }
    if (updates.clientId !== undefined) cleanUpdates.client_id = updates.clientId;
    if (updates.clientName !== undefined) cleanUpdates.client_name = updates.clientName;

    const existing = await requirementRepository.findById(id);
    await requirementRepository.update(id, cleanUpdates, performedBy);
    const updated = await requirementRepository.findById(id);

    if (updated) {
      await DomainEventPublisher.publishDomainEvent({
        type: "REQUIREMENT_UPDATED",
        aggregateType: "Requirement",
        aggregateId: id,
        organizationId: updated.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: updated
      });

      // Broadcast event
      if (
        (updates.status === "open" || updates.status === "broadcast" || updates.broadcast === true) &&
        (!existing || (existing.status !== "open" && existing.status !== "broadcast"))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_BROADCAST",
          aggregateType: "Requirement",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Closed event
      if (updates.status === "closed" && (!existing || existing.status !== "closed")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_CLOSED",
          aggregateType: "Requirement",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Cancelled event
      if (updates.status === "cancelled" && (!existing || existing.status !== "cancelled")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_CANCELLED",
          aggregateType: "Requirement",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
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
    const existing = await requirementRepository.findById(id);
    await requirementRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "REQUIREMENT_CANCELLED",
        aggregateType: "Requirement",
        aggregateId: id,
        organizationId: existing.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: { id, deleted: true }
      });
    }
  }
}

export const requirementService = new RequirementService();
