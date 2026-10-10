import { BaseRepository } from "./BaseRepository";

export class UserRepository extends BaseRepository<any> {
  protected collectionName = "users";
  protected entityType = "user";

  async findById(id: string, includeArchived: boolean = false): Promise<any | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!includeArchived && data?.deleted) return null;
    return { ...data, id: doc.id };
  }

  async findByEmail(email: string, includeArchived: boolean = false): Promise<any | null> {
    const query = await this.db.collection(this.collectionName).where('email', '==', email).limit(1).get();
    if (query.empty) return null;
    const doc = query.docs[0];
    const data = doc.data();
    if (!includeArchived && data?.deleted) return null;
    return { ...data, id: doc.id };
  }

  async findAll(includeArchived: boolean = false): Promise<any[]> {
    const snapshot = await this.db.collection(this.collectionName).get();
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter((d: any) => includeArchived || !d.deleted);
  }
}

export const userRepository = new UserRepository();
