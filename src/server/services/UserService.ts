import { userRepository } from "../repositories/UserRepository";

export class UserService {
  async getById(id: string) {
    return await userRepository.findById(id);
  }
  
  async getByEmail(email: string) {
    return await userRepository.findByEmail(email);
  }

  async list() {
    return await userRepository.findAll();
  }

  async create(data: any, performedBy: string = 'System') {
    return await userRepository.create(data, performedBy);
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    await userRepository.update(id, updates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await userRepository.archive(id, performedBy);
  }
}

export const userService = new UserService();
