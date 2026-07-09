import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import { UnitOfWork } from "../utils/UnitOfWork";
import * as crypto from "crypto";

export abstract class BaseRepository<T extends { id: string; organizationId?: string; deleted?: boolean; version?: number }> {
  protected abstract collectionName: string;
  protected abstract entityType: string;

  protected get db(): Firestore {
    return getAdminDb();
  }

  async create(data: T, performedBy: string, transaction?: Transaction): Promise<T> {
    if (!transaction) {
      return await UnitOfWork.run(t => this.create(data, performedBy, t));
    }

    const id = data.id || crypto.randomUUID();
    const docData = { ...data, id, version: 1 };
    
    const docRef = this.db.collection(this.collectionName).doc(id);
    transaction.set(docRef, docData);
    
    await DomainEventPublisher.publish(
      `${this.entityType.toUpperCase()}_CREATED`,
      this.entityType,
      id,
      performedBy,
      docData,
      transaction
    );
    
    return docData as T;
  }

  async update(id: string, updates: Partial<T>, performedBy: string, transaction?: Transaction): Promise<void> {
    if (!transaction) {
      return await UnitOfWork.run(t => this.update(id, updates, performedBy, t));
    }

    const docRef = this.db.collection(this.collectionName).doc(id);
    const doc = await transaction.get(docRef);
    
    if (!doc.exists) {
      throw new Error(`Not found: ${this.entityType} ${id}`);
    }
    
    const currentVersion = doc.data()?.version || 1;
    if (updates.version && updates.version !== currentVersion) {
      throw new Error(`409 Conflict: Version mismatch for ${this.entityType} ${id}`);
    }

    const newVersion = currentVersion + 1;
    const finalUpdates = { ...updates, version: newVersion, updatedAt: new Date().toISOString() };
    
    transaction.update(docRef, finalUpdates);
    
    await DomainEventPublisher.publish(
      `${this.entityType.toUpperCase()}_UPDATED`,
      this.entityType,
      id,
      performedBy,
      finalUpdates,
      transaction
    );
  }

  async archive(id: string, performedBy: string, transaction?: Transaction): Promise<void> {
    if (!transaction) {
      return await UnitOfWork.run(t => this.archive(id, performedBy, t));
    }

    const docRef = this.db.collection(this.collectionName).doc(id);
    
    // Check if it exists before trying to update
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw new Error(`Not found: ${this.entityType} ${id}`);
    }

    transaction.update(docRef, { deleted: true, updatedAt: new Date().toISOString() });
    
    await DomainEventPublisher.publish(
      `${this.entityType.toUpperCase()}_ARCHIVED`,
      this.entityType,
      id,
      performedBy,
      null,
      transaction
    );
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as T;
    if (data.deleted) return null;
    return { ...data, id: doc.id };
  }

  async findByOrganization(orgId: string): Promise<T[]> {
    const snapshot = await this.db.collection(this.collectionName)
      .where("organizationId", "==", orgId)
      .where("deleted", "!=", true)
      .get();
      
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
  }

  async findAll(): Promise<T[]> {
    const snapshot = await this.db.collection(this.collectionName).get();
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as T))
      .filter(d => !d.deleted);
  }

  async search(criteria: Record<string, any>): Promise<T[]> {
    let query: FirebaseFirestore.Query = this.db.collection(this.collectionName);
    
    for (const [key, value] of Object.entries(criteria)) {
      query = query.where(key, "==", value);
    }
    
    const snapshot = await query.get();
    return snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as T))
      .filter(d => !d.deleted);
  }

  async count(): Promise<number> {
    const snapshot = await this.db.collection(this.collectionName).count().get();
    return snapshot.data().count;
  }

  async exists(id: string): Promise<boolean> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    return doc.exists && !doc.data()?.deleted;
  }
}
