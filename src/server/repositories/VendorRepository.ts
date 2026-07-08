import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class VendorRepository {
  private get db(): Firestore {
    return getAdminDb();
  }

  async runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction(updateFunction);
  }

  async getById(id: string, transaction?: Transaction): Promise<any> {
    const ref = this.db.collection("vendors").doc(id);
    const doc = transaction ? await transaction.get(ref) : await ref.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async list(): Promise<any[]> {
    const query = await this.db.collection("vendors").get();
    const items: any[] = [];
    query.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  }
  
  async create(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("vendors").doc(id);
    if (transaction) {
      transaction.set(ref, data);
    } else {
      await ref.set(data);
    }
  }

  async update(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("vendors").doc(id);
    if (transaction) {
      transaction.update(ref, data);
    } else {
      await ref.update(data);
    }
  }

  async delete(id: string, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("vendors").doc(id);
    if (transaction) {
      transaction.delete(ref);
    } else {
      await ref.delete();
    }
  }
}

export const vendorRepository = new VendorRepository();
