import { clientRepository } from "../repositories/ClientRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class ClientService {
  async getById(id: string, userContext?: any) {
    const client = await clientRepository.findById(id);
    if (!client) return null;
    
    if (userContext) {
      if (userContext.userId === "executive-root") return client;
      if (userContext.organizationId && client.organizationId && client.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && client.id !== userContext.clientId) {
        return null;
      }
    }
    return client;
  }

  async list(userContext?: any) {
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
          organizationId: data.organizationId || "bootstrap-org",
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
    
    let unique = combined.filter(c => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    // Apply context-based filtering
    if (userContext) {
      unique = unique.filter(c => {
        if (userContext.userId === "executive-root") return true;
        
        // Tenant isolation
        if (userContext.organizationId && c.organizationId && c.organizationId !== userContext.organizationId) {
          return false;
        }

        // Role-based filtering
        if (userContext.workspace === "Client" && userContext.clientId) {
          return c.id === userContext.clientId || c.companyId === userContext.clientId;
        }

        return true;
      });
    }

    const compareDates = (aVal: any, bVal: any): number => {
      const getMs = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'string') {
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        if (val instanceof Date) {
          return val.getTime();
        }
        if (val && typeof val.toDate === 'function') {
          try {
            return val.toDate().getTime();
          } catch {
            // ignore
          }
        }
        if (val && typeof val.seconds === 'number') {
          return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
        }
        if (val && typeof val._seconds === 'number') {
          return val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000);
        }
        if (typeof val === 'number') {
          return val;
        }
        return 0;
      };
      return getMs(bVal) - getMs(aVal);
    };

    return unique.sort((a: any, b: any) => compareDates(a.createdAt, b.createdAt));
  }

  async create(data: any, performedBy: string = 'System', userContext?: any) {
    const id = data.id || crypto.randomUUID();
    const client: any = {
      ...data,
      id,
      company: data.company || '',
      name: data.name || '',
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await clientRepository.create(client, performedBy);

    await DomainEventPublisher.publishDomainEvent({
      type: "CLIENT_CREATED",
      aggregateType: "Client",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || "bootstrap-org",
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    const existing = await clientRepository.findById(id);
    await clientRepository.update(id, cleanUpdates, performedBy);
    const updated = await clientRepository.findById(id);

    if (updated) {
      await DomainEventPublisher.publishDomainEvent({
        type: "CLIENT_UPDATED",
        aggregateType: "Client",
        aggregateId: id,
        organizationId: updated.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: updated
      });

      if (updates.status === "approved" && (!existing || existing.status !== "approved")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CLIENT_APPROVED",
          aggregateType: "Client",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      if ((updates.status === "deactivated" || updates.status === "inactive") && (!existing || (existing.status !== "deactivated" && existing.status !== "inactive"))) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CLIENT_DEACTIVATED",
          aggregateType: "Client",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }
    }
  }

  async delete(id: string, performedBy: string = 'System') {
    const existing = await clientRepository.findById(id);
    await clientRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "CLIENT_DEACTIVATED",
        aggregateType: "Client",
        aggregateId: id,
        organizationId: existing.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: { id, deleted: true }
      });
    }
  }
}

export const clientService = new ClientService();
