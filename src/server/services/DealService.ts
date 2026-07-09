import { dealRepository } from "../repositories/DealRepository";

export class DealService {
  async getById(id: string) {
    return await dealRepository.findById(id);
  }

  async list() {
    return await dealRepository.findAll();
  }

  async create(data: any, performedBy: string = 'System') {
    return await dealRepository.create(data, performedBy);
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    await dealRepository.update(id, updates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await dealRepository.archive(id, performedBy);
  }
}

export const dealService = new DealService();
