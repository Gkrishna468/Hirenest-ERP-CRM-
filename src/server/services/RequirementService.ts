import { requirementRepository } from "../repositories/RequirementRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class RequirementService {
  async getById(id: string) {
    return await requirementRepository.findById(id);
  }

  async list() {
    const list = await requirementRepository.findAll();
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

    return await requirementRepository.create(requirement, performedBy);
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

    await requirementRepository.update(id, cleanUpdates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await requirementRepository.archive(id, performedBy);
  }
}

export const requirementService = new RequirementService();
