const fs = require('fs');

function createRepoAndService(domain, collection) {
  const Domain = domain.charAt(0).toUpperCase() + domain.slice(1);
  const repoStr = `import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class ${Domain}Repository {
  private get db(): Firestore {
    return getAdminDb();
  }

  async runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction(updateFunction);
  }

  async getById(id: string, transaction?: Transaction): Promise<any> {
    const ref = this.db.collection("${collection}").doc(id);
    const doc = transaction ? await transaction.get(ref) : await ref.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async list(): Promise<any[]> {
    const query = await this.db.collection("${collection}").get();
    const items: any[] = [];
    query.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  }
  
  async create(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("${collection}").doc(id);
    if (transaction) {
      transaction.set(ref, data);
    } else {
      await ref.set(data);
    }
  }

  async update(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("${collection}").doc(id);
    if (transaction) {
      transaction.update(ref, data);
    } else {
      await ref.update(data);
    }
  }

  async delete(id: string, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("${collection}").doc(id);
    if (transaction) {
      transaction.delete(ref);
    } else {
      await ref.delete();
    }
  }
}

export const ${domain}Repository = new ${Domain}Repository();
`;
  
  const serviceStr = `import { ${domain}Repository } from "../repositories/${Domain}Repository";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";
import { domainEventPublisher } from "../events/DomainEventPublisher";

export class ${Domain}Service {
  async getById(id: string) {
    return await ${domain}Repository.getById(id);
  }

  async list() {
    return await ${domain}Repository.list();
  }

  async create(data: any, performedBy: string = 'System') {
    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await ${domain}Repository.create(id, item, transaction);
      
      domainEventPublisher.publish({
        eventType: "${collection.toUpperCase().slice(0, -1)}_CREATED",
        entityCollection: "${collection}",
        entityId: id,
        metadata: { performedBy },
        performedBy
      }, transaction);
    });

    return item;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await ${domain}Repository.update(id, cleanUpdates, transaction);
      
      domainEventPublisher.publish({
        eventType: "${collection.toUpperCase().slice(0, -1)}_UPDATED",
        entityCollection: "${collection}",
        entityId: id,
        metadata: { updates: Object.keys(updates), performedBy },
        performedBy
      }, transaction);
    });
  }

  async delete(id: string, performedBy: string = 'System') {
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      await ${domain}Repository.delete(id, transaction);
      
      domainEventPublisher.publish({
        eventType: "${collection.toUpperCase().slice(0, -1)}_DELETED",
        entityCollection: "${collection}",
        entityId: id,
        metadata: { performedBy },
        performedBy
      }, transaction);
    });
  }
}

export const ${domain}Service = new ${Domain}Service();
`;

  fs.writeFileSync(`src/server/repositories/${Domain}Repository.ts`, repoStr);
  fs.writeFileSync(`src/server/services/${Domain}Service.ts`, serviceStr);
}

createRepoAndService('vendor', 'vendors');
createRepoAndService('candidate', 'candidates');
createRepoAndService('submission', 'submissions');
