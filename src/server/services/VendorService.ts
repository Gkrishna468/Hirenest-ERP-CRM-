import { vendorRepository } from "../repositories/VendorRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class VendorService {
  async getById(id: string) {
    return await vendorRepository.findById(id);
  }

  async list() {
    return await vendorRepository.findAll();
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await vendorRepository.create(item, performedBy);

    return item;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    await vendorRepository.update(id, cleanUpdates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await vendorRepository.archive(id, performedBy);
  }
}

export const vendorService = new VendorService();
