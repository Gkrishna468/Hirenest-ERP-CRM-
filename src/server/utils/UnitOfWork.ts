import { Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export class UnitOfWork {
  static async run<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    const db = getAdminDb();
    return await db.runTransaction(async (t) => {
      return await callback(t);
    });
  }
}
