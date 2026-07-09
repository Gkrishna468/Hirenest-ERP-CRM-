import { submissionRepository } from "../repositories/SubmissionRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class SubmissionService {
  async getById(id: string) {
    return await submissionRepository.findById(id);
  }

  async list() {
    return await submissionRepository.findAll();
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await submissionRepository.create(item, performedBy);

    return item;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    await submissionRepository.update(id, cleanUpdates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await submissionRepository.archive(id, performedBy);
  }
}

export const submissionService = new SubmissionService();
