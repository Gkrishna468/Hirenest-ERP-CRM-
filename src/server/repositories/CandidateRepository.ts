import { Firestore, FieldValue, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class CandidateRepository {
  private get db(): Firestore {
    return getAdminDb();
  }

  async runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction(updateFunction);
  }

  async findIdentityByEmailOrPhone(email: string, phone: string): Promise<any> {
    const identities = [];
    if (email) identities.push(email.trim().toLowerCase());
    if (phone) identities.push(phone.replace(/[^0-9]/g, ''));

    if (identities.length === 0) return null;

    const vaultQuery = await this.db.collection("candidate_identity_vault")
      .where("identities", "array-contains-any", identities)
      .limit(1)
      .get();

    if (!vaultQuery.empty) {
      return { id: vaultQuery.docs[0].id, ...vaultQuery.docs[0].data() } as any;
    }
    return null;
  }

  async getRequirement(reqId: string, transaction?: Transaction): Promise<any> {
    const ref = this.db.collection("requirements").doc(reqId);
    const doc = transaction ? await transaction.get(ref) : await ref.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async getVendor(vendorId: string, transaction?: Transaction): Promise<any> {
    const ref = this.db.collection("vendors").doc(vendorId);
    const doc = transaction ? await transaction.get(ref) : await ref.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async getActiveRequirements(): Promise<any[]> {
    const reqQuery = await this.db.collection("requirements").get();
    const requirements: any[] = [];
    reqQuery.forEach(doc => {
      requirements.push({ id: doc.id, ...doc.data() });
    });
    return requirements;
  }

  async getAvailableCandidatesForVendor(vendorId: string): Promise<any[]> {
    const poolQuery = await this.db.collection("candidates")
      .where("vendorId", "==", vendorId)
      .where("stage", "==", "Available")
      .get();
      
    const candidates: any[] = [];
    poolQuery.forEach(doc => {
      candidates.push({ id: doc.id, ...doc.data() });
    });
    return candidates;
  }
  
  async getAiReprocessingQueuePending(limit: number = 10): Promise<any[]> {
    const queueQuery = await this.db.collection("ai_reprocessing_queue")
      .where("status", "==", "pending")
      .limit(limit)
      .get();
      
    const queue: any[] = [];
    queueQuery.forEach(doc => {
      queue.push({ id: doc.id, ...doc.data() });
    });
    return queue;
  }
  
  async getCandidateAvailability(candidateId: string): Promise<any> {
    const availQuery = await this.db.collection("candidate_availability")
      .where("candidateId", "==", candidateId)
      .get();
    if (!availQuery.empty) {
      return { id: availQuery.docs[0].id, ...availQuery.docs[0].data() };
    }
    return null;
  }
}

export const candidateRepository = new CandidateRepository();
