import { 
  collection, doc, getDoc, getDocs, 
  setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, queryEqual
} from 'firebase/firestore';
import { db } from './config';

export const dbProxy = {
  async getDoc(collectionName: string, id: string): Promise<any> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async getDocs(collectionName: string, options?: {
    where?: Array<{ field: string, op: string, value: any }>;
    orderBy?: Array<{ field: string, direction?: "asc" | "desc" }>;
    limit?: number;
  }): Promise<any[]> {
    const collRef = collection(db, collectionName);
    const constraints: any[] = [];

    if (options?.where) {
      for (const w of options.where) {
        constraints.push(where(w.field, w.op as any, w.value));
      }
    }

    if (options?.orderBy) {
      for (const o of options.orderBy) {
        constraints.push(orderBy(o.field, o.direction || "asc"));
      }
    }

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const items: any[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  },

  async setDoc(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  },

  async addDoc(collectionName: string, data: any): Promise<any> {
    const collRef = collection(db, collectionName);
    const docRef = await addDoc(collRef, data);
    return { id: docRef.id, ...data };
  },

  async updateDoc(collectionName: string, id: string, updates: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updates);
  },

  async deleteDoc(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }
};

// Expose globally for both typescript and runtime
(window as any).dbProxy = dbProxy;

declare global {
  interface Window {
    dbProxy: typeof dbProxy;
  }
}
