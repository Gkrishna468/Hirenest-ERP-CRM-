import { clientRepository } from "../repositories/ClientRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class ClientService {
  async getById(id: string) {
    return await clientRepository.findById(id);
  }

  async list() {
    const firebaseClients = await clientRepository.findAll();
    const users = await clientRepository.listUsers();
    
    const orgNames = new Map<string, string>();
    users.forEach((data: any) => {
      if (data.organizationId) {
        let name = data.companyName;
        if (!name && data.email) {
           const domain = data.email.split('@')[1];
           if (domain && domain !== 'gmail.com' && domain !== 'yahoo.com' && domain !== 'outlook.com') {
             name = domain.split('.')[0];
             name = name.charAt(0).toUpperCase() + name.slice(1);
           }
        }
        if (name) orgNames.set(data.organizationId, name);
      }
    });

    const reqsDocs = await clientRepository.listRequirements();
    const reqsClientsMap = new Map<string, any>();
    reqsDocs.forEach((data: any) => {
      const clientId = data.clientId || data.client_id;
      let clientName = data.clientName || data.client_name;
      if (!clientName && clientId) {
        clientName = orgNames.get(clientId) || `Client ${clientId.slice(-5)}`;
      }
      if (clientId && !reqsClientsMap.has(clientId)) {
        reqsClientsMap.set(clientId, {
          id: clientId,
          company: clientName,
          name: clientName,
          email: '',
          phone: '',
          location: '',
          industry: '',
          budget: 'Medium',
          contactPerson: '',
          website: '',
          clientCode: clientId,
          notes: 'Extracted from Requirements (OS)',
          userId: '',
          companyId: clientId,
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
          source: 'os'
        });
      }
    });

    const extractedClients = Array.from(reqsClientsMap.values());
    const existingIds = new Set(firebaseClients.map(c => c.id));
    const newExtracted = extractedClients.filter(c => !existingIds.has(c.id));
    const combined = [...firebaseClients, ...newExtracted];
    const seen = new Set<string>();
    
    const unique = combined.filter(c => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    return unique.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const client: any = {
      ...data,
      id,
      company: data.company || '',
      name: data.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await clientRepository.create(client, performedBy);
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    await clientRepository.update(id, cleanUpdates, performedBy);
  }

  async delete(id: string, performedBy: string = 'System') {
    await clientRepository.archive(id, performedBy);
  }
}

export const clientService = new ClientService();
