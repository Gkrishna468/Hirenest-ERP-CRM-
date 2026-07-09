import { vendorRepository } from "../repositories/VendorRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class VendorService {
  async getById(id: string, userContext?: any) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) return null;
    if (userContext) {
      if (userContext.userId === "executive-root") return vendor;
      if (userContext.organizationId && vendor.organizationId && vendor.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && userContext.vendorId && vendor.id !== userContext.vendorId) {
        return null;
      }
    }
    return vendor;
  }

  async list(userContext?: any) {
    let list = await vendorRepository.findAll();
    if (userContext) {
      list = list.filter(v => {
        if (userContext.userId === "executive-root") return true;
        if (userContext.organizationId && v.organizationId && v.organizationId !== userContext.organizationId) {
          return false;
        }
        if (userContext.workspace === "Vendor" && userContext.vendorId) {
          return v.id === userContext.vendorId;
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
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await vendorRepository.create(item, performedBy);

    await DomainEventPublisher.publishDomainEvent({
      type: "VENDOR_CREATED",
      aggregateType: "Vendor",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || id,
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    const existing = await vendorRepository.findById(id);
    await vendorRepository.update(id, cleanUpdates, performedBy);
    const updated = await vendorRepository.findById(id);

    if (updated) {
      // Trigger VENDOR_SLA_UPDATED if SLA terms or metrics changed
      if (
        (updates.sla !== undefined && (!existing || existing.sla !== updates.sla)) ||
        (updates.slaResponseTime !== undefined && (!existing || existing.slaResponseTime !== updates.slaResponseTime))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_SLA_UPDATED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger VENDOR_APPROVED
      if (updates.status === "approved" && (!existing || existing.status !== "approved")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_APPROVED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger VENDOR_ONBOARDED
      if (updates.status === "onboarded" && (!existing || existing.status !== "onboarded")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_ONBOARDED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger VENDOR_MONTHLY_VALIDATED if compliance checked or lastValidationTime changed
      if (updates.lastValidationTime !== undefined && (!existing || existing.lastValidationTime !== updates.lastValidationTime)) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_MONTHLY_VALIDATED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
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
    await vendorRepository.archive(id, performedBy);
  }
}

export const vendorService = new VendorService();
