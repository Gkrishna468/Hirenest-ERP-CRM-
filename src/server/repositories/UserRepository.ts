import { BaseRepository } from "./BaseRepository";

export class UserRepository extends BaseRepository<any> {
  protected collectionName = "users";
  protected entityType = "user";

  async findByEmail(email: string): Promise<any | null> {
    const query = await this.db.collection(this.collectionName).where('email', '==', email).limit(1).get();
    if (query.empty) return null;
    const doc = query.docs[0];
    const data = doc.data();
    if (data.deleted) return null;
    return { ...data, id: doc.id };
  }
}

export const userRepository = new UserRepository();
