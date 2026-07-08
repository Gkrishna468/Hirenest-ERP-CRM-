import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class CandidateRepository {
  private get db(): Firestore {
    return getAdminDb();
  }

  async runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction(updateFunction);
  }

  async getById(id: string, transaction?: Transaction): Promise<any> {
    const ref = this.db.collection("candidates").doc(id);
    const doc = transaction ? await transaction.get(ref) : await ref.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async list(): Promise<any[]> {
    const query = await this.db.collection("candidates").get();
    const items: any[] = [];
    query.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  }
  
  async create(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("candidates").doc(id);
    if (transaction) {
      transaction.set(ref, data);
    } else {
      await ref.set(data);
    }
  }

  async update(id: string, data: any, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("candidates").doc(id);
    if (transaction) {
      transaction.update(ref, data);
    } else {
      await ref.update(data);
    }
  }

  async delete(id: string, transaction?: Transaction): Promise<void> {
    const ref = this.db.collection("candidates").doc(id);
    if (transaction) {
      transaction.delete(ref);
    } else {
      await ref.delete();
    }
  }

 

  async findIdentityByEmailOrPhone(email: string, phone: string): Promise<any> {
    const db = getAdminDb();
    if (email) {
      const emailQuery = await db.collection("candidates").where("email", "==", email).get();
      if (!emailQuery.empty) return { id: emailQuery.docs[0].id, ...emailQuery.docs[0].data() };
    }
    if (phone) {
      const phoneQuery = await db.collection("candidates").where("phone", "==", phone).get();
      if (!phoneQuery.empty) return { id: phoneQuery.docs[0].id, ...phoneQuery.docs[0].data() };
    }
    return null;
  }

  async getRequirement(reqId: string, transaction?: any): Promise<any> {
    const db = getAdminDb();
    const doc = await db.collection("requirements").doc(reqId).get();
    if (doc.exists) return { id: doc.id, ...doc.data() };
    return null;
  }

  async getAiReprocessingQueuePending(transaction?: any): Promise<any[]> {
    const db = getAdminDb();
    const query = await db.collection("ai_reprocessing_queue").where("status", "==", "pending").get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getAvailableCandidatesForVendor(vendorId: string): Promise<any[]> {
    const db = getAdminDb();
    const query = await db.collection("candidates").where("vendorId", "==", vendorId).where("status", "==", "active").get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getActiveRequirements(clientId?: string): Promise<any[]> {
    const db = getAdminDb();
    let queryRef: any = db.collection("requirements").where("status", "==", "open");
    if (clientId) queryRef = queryRef.where("clientId", "==", clientId);
    const query = await queryRef.get();
    return query.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  async getVendor(vendorId: string): Promise<any> {
    const db = getAdminDb();
    const doc = await db.collection("vendors").doc(vendorId).get();
    if (doc.exists) return { id: doc.id, ...doc.data() };
    return null;
  }

  async getCandidateAvailability(candidateId: string): Promise<any> {
    const db = getAdminDb();
    const query = await db.collection("candidate_submissions").where("candidateId", "==", candidateId).get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

}
export const candidateRepository = new CandidateRepository();
