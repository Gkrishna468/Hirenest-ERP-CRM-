import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class ClientRepository {
  private get db(): Firestore {
    return getAdminDb();
  }

  async runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction(updateFunction);
  }

  async getById(id: string, transaction?: Transaction): Promise<any> {
    const ref = this.db.collection("clients").doc(id);
    const doc = transaction ? await transaction.get(ref) : await ref.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async list(): Promise<any[]> {
    const query = await this.db.collection("clients").get();
    const clients: any[] = [];
    query.forEach(doc => {
      clients.push({ id: doc.id, ...doc.data() });
    });
    return clients;
  }

  async listUsers(): Promise<any[]> {
    const query = await this.db.collection("users").get();
    const users: any[] = [];
    query.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  }

  async listRequirements(): Promise<any[]> {
    const query = await this.db.collection("requirements").get();
    const reqs: any[] = [];
    query.forEach(doc => {
      reqs.push({ id: doc.id, ...doc.data() });
    });
    return reqs;
  }
  
  async create(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("clients").doc(id);
    if (transaction) {
      transaction.set(ref, data);
    } else {
      await ref.set(data);
    }
  }

  async update(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("clients").doc(id);
    if (transaction) {
      transaction.update(ref, data);
    } else {
      await ref.update(data);
    }
  }

  async delete(id: string, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("clients").doc(id);
    if (transaction) {
      transaction.delete(ref);
    } else {
      await ref.delete();
    }
  }
}

export const clientRepository = new ClientRepository();
