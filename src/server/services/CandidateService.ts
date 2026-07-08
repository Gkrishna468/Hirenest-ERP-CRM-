import { candidateRepository } from "../repositories/CandidateRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";
import { domainEventPublisher } from "../events/DomainEventPublisher";

export class CandidateService {
  async getById(id: string) {
    return await candidateRepository.getById(id);
  }

  async list() {
    return await candidateRepository.list();
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
      await candidateRepository.create(id, item, transaction);
      
      domainEventPublisher.publish({
        eventType: "CANDIDATE_CREATED",
        entityCollection: "candidates",
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
      await candidateRepository.update(id, cleanUpdates, transaction);
      
      domainEventPublisher.publish({
        eventType: "CANDIDATE_UPDATED",
        entityCollection: "candidates",
        entityId: id,
        metadata: { updates: Object.keys(updates), performedBy },
        performedBy
      }, transaction);
    });
  }

  async delete(id: string, performedBy: string = 'System') {
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await candidateRepository.delete(id, transaction);
      
      domainEventPublisher.publish({
        eventType: "CANDIDATE_DELETED",
        entityCollection: "candidates",
        entityId: id,
        metadata: { performedBy },
        performedBy
      }, transaction);
    });
  }
}

export const candidateService = new CandidateService();
