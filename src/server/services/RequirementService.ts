import { requirementRepository } from "../repositories/RequirementRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class RequirementService {
  async getById(id: string) {
    return await requirementRepository.getById(id);
  }

  async list() {
    const list = await requirementRepository.list();
    return list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const requirement: any = {
      ...data,
      id,
      companyId: data.companyId || data.clientId || '',
      title: data.title || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionsCount: 0,
      status: data.status || 'pending',
      approvalStatus: data.approvalStatus || 'pending',
    };

    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await requirementRepository.create(id, requirement, transaction);
      
      const eventRef = db.collection("system_events").doc();
      transaction.set(eventRef, {
        eventType: "REQUIREMENT_CREATED",
        entityCollection: "requirements",
        entityId: id,
        metadata: { title: requirement.title, performedBy },
        createdAt: new Date().toISOString()
      });
    });

    return requirement;
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

    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await requirementRepository.update(id, cleanUpdates, transaction);
      
      const eventRef = db.collection("system_events").doc();
      transaction.set(eventRef, {
        eventType: "REQUIREMENT_UPDATED",
        entityCollection: "requirements",
        entityId: id,
        metadata: { updates: Object.keys(updates), performedBy },
        createdAt: new Date().toISOString()
      });
    });
  }

  async delete(id: string, performedBy: string = 'System') {
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await requirementRepository.delete(id, transaction);
      
      const eventRef = db.collection("system_events").doc();
      transaction.set(eventRef, {
        eventType: "REQUIREMENT_DELETED",
        entityCollection: "requirements",
        entityId: id,
        metadata: { performedBy },
        createdAt: new Date().toISOString()
      });
    });
  }
}

export const requirementService = new RequirementService();
