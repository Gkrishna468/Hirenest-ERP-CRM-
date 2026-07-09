import { BaseRepository } from "./BaseRepository";
import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class ClientRepository extends BaseRepository<any> {
  protected collectionName = "clients";
  protected entityType = "client";





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
  


}

export const clientRepository = new ClientRepository();
