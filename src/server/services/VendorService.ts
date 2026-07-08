import { vendorRepository } from "../repositories/VendorRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";
import { domainEventPublisher } from "../events/DomainEventPublisher";

export class VendorService {
  async getById(id: string) {
    return await vendorRepository.getById(id);
  }

  async list() {
    return await vendorRepository.list();
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await vendorRepository.create(id, item, transaction);
      
      domainEventPublisher.publish({
        eventType: "VENDOR_CREATED",
        entityCollection: "vendors",
        entityId: id,
        metadata: { performedBy },
        performedBy
      }, transaction);
    });

    return item;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await vendorRepository.update(id, cleanUpdates, transaction);
      
      domainEventPublisher.publish({
        eventType: "VENDOR_UPDATED",
        entityCollection: "vendors",
        entityId: id,
        metadata: { updates: Object.keys(updates), performedBy },
        performedBy
      }, transaction);
    });
  }

  async delete(id: string, performedBy: string = 'System') {
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await vendorRepository.delete(id, transaction);
      
      domainEventPublisher.publish({
        eventType: "VENDOR_DELETED",
        entityCollection: "vendors",
        entityId: id,
        metadata: { performedBy },
        performedBy
      }, transaction);
    });
  }
}

export const vendorService = new VendorService();
