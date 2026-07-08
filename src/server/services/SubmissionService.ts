import { submissionRepository } from "../repositories/SubmissionRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";
import { domainEventPublisher } from "../events/DomainEventPublisher";

export class SubmissionService {
  async getById(id: string) {
    return await submissionRepository.getById(id);
  }

  async list() {
    return await submissionRepository.list();
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
      await submissionRepository.create(id, item, transaction);
      
      domainEventPublisher.publish({
        eventType: "SUBMISSION_CREATED",
        entityCollection: "submissions",
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
      await submissionRepository.update(id, cleanUpdates, transaction);
      
      domainEventPublisher.publish({
        eventType: "SUBMISSION_UPDATED",
        entityCollection: "submissions",
        entityId: id,
        metadata: { updates: Object.keys(updates), performedBy },
        performedBy
      }, transaction);
    });
  }

  async delete(id: string, performedBy: string = 'System') {
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await submissionRepository.delete(id, transaction);
      
      domainEventPublisher.publish({
        eventType: "SUBMISSION_DELETED",
        entityCollection: "submissions",
        entityId: id,
        metadata: { performedBy },
        performedBy
      }, transaction);
    });
  }
}

export const submissionService = new SubmissionService();
