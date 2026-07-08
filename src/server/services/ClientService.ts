import { clientRepository } from "../repositories/ClientRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class ClientService {
  async getById(id: string) {
    return await clientRepository.getById(id);
  }

  async list() {
    const firebaseClients = await clientRepository.list();
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

    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await clientRepository.create(id, client, transaction);
      
      const eventRef = db.collection("system_events").doc();
      transaction.set(eventRef, {
        eventType: "CLIENT_CREATED",
        entityCollection: "clients",
        entityId: id,
        metadata: { name: client.name, company: client.company, performedBy },
        createdAt: new Date().toISOString()
      });
    });

    return client;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await clientRepository.update(id, cleanUpdates, transaction);
      
      const eventRef = db.collection("system_events").doc();
      transaction.set(eventRef, {
        eventType: "CLIENT_UPDATED",
        entityCollection: "clients",
        entityId: id,
        metadata: { updates: Object.keys(updates), performedBy },
        createdAt: new Date().toISOString()
      });
    });
  }

  async delete(id: string, performedBy: string = 'System') {
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await clientRepository.delete(id, transaction);
      
      const eventRef = db.collection("system_events").doc();
      transaction.set(eventRef, {
        eventType: "CLIENT_DELETED",
        entityCollection: "clients",
        entityId: id,
        metadata: { performedBy },
        createdAt: new Date().toISOString()
      });
    });
  }
}

export const clientService = new ClientService();
