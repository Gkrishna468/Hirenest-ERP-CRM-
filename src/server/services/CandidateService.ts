import { candidateRepository } from "../repositories/CandidateRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class CandidateService {
  async getById(id: string) {
    return await candidateRepository.findById(id);
  }

  async list() {
    return await candidateRepository.findAll();
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await candidateRepository.create(item, performedBy);

    return item;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    await candidateRepository.update(id, cleanUpdates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await candidateRepository.archive(id, performedBy);
  }
}

export const candidateService = new CandidateService();
