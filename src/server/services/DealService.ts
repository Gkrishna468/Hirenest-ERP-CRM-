import { dealRepository } from "../repositories/DealRepository";
import { DomainEventPublisher } from "../events/DomainEventPublisher";

export class DealService {
  async getById(id: string, userContext?: any) {
    const deal = await dealRepository.findById(id);
    if (!deal) return null;
    if (userContext) {
      if (userContext.userId === "executive-root") return deal;
      if (userContext.organizationId && deal.organizationId && deal.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && userContext.vendorId && deal.vendorId !== userContext.vendorId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && deal.clientId !== userContext.clientId) {
        return null;
      }
    }
    return deal;
  }

  async list(userContext?: any) {
    let list = await dealRepository.findAll();
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
    const item = {
      ...data,
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      vendorId: data.vendorId || userContext?.vendorId || '',
      clientId: data.clientId || userContext?.clientId || '',
    };
    const created = await dealRepository.create(item, performedBy);

    // Publish PLACEMENT_CREATED
    await DomainEventPublisher.publishDomainEvent({
      type: "PLACEMENT_CREATED",
      aggregateType: "Placement",
      aggregateId: created.id || data.id,
      organizationId: created.organizationId || data.organizationId || "bootstrap-org",
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: userContext?.workspace === "Vendor" || userContext?.workspace === "Client" ? "OS" : "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const existing = await dealRepository.findById(id);
    await dealRepository.update(id, updates, performedBy);
    const updated = await dealRepository.findById(id);

    if (updated) {
      const status = updates.status;
      const prevStatus = existing?.status;

      if (status && status !== prevStatus) {
        // Map status changes to specific Domain Business Events
        
        // 1. Interviews
        if (status === "scheduled" || status === "interviewing") {
          const type = (prevStatus === "scheduled" || prevStatus === "interviewing") 
            ? "INTERVIEW_RESCHEDULED" 
            : "INTERVIEW_SCHEDULED";
          await DomainEventPublisher.publishDomainEvent({
            type,
            aggregateType: "Interview",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        } else if (status === "interview_completed" || status === "interviewed") {
          await DomainEventPublisher.publishDomainEvent({
            type: "INTERVIEW_COMPLETED",
            aggregateType: "Interview",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        } else if (status === "interview_cancelled") {
          await DomainEventPublisher.publishDomainEvent({
            type: "INTERVIEW_CANCELLED",
            aggregateType: "Interview",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        }

        // 2. Offers
        if (status === "offered" || status === "offer_released") {
          await DomainEventPublisher.publishDomainEvent({
            type: "OFFER_RELEASED",
            aggregateType: "Offer",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        } else if (status === "offer_accepted" || status === "accepted" || status === "joined" || status === "joining") {
          await DomainEventPublisher.publishDomainEvent({
            type: "OFFER_ACCEPTED",
            aggregateType: "Offer",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        } else if (status === "offer_declined" || status === "declined") {
          await DomainEventPublisher.publishDomainEvent({
            type: "OFFER_DECLINED",
            aggregateType: "Offer",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        }

        // 3. Placements
        if (status === "placed" || status === "confirmed") {
          await DomainEventPublisher.publishDomainEvent({
            type: "PLACEMENT_CONFIRMED",
            aggregateType: "Placement",
            aggregateId: id,
            organizationId: updated.organizationId || "default",
            actorId: performedBy,
            actorRole: "Admin",
            sourceApp: "CRM",
            sourceWorkspace: "Admin",
            payload: updated
          });
        } else if (status === "cancelled") {
          await DomainEventPublisher.publishDomainEvent({
            type: "PLACEMENT_CANCELLED",
            aggregateType: "Placement",
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
  }

  async delete(id: string, performedBy: string = 'System') {
    const existing = await dealRepository.findById(id);
    await dealRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "PLACEMENT_CANCELLED",
        aggregateType: "Placement",
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

export const dealService = new DealService();

