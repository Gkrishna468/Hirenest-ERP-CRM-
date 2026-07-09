import { Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";

export class DomainEventPublisher {
  static async publish(
    eventType: string, 
    entityType: string, 
    entityId: string, 
    performedBy: string, 
    metadata?: any,
    transaction?: Transaction
  ) {
    const db = getAdminDb();
    const eventId = crypto.randomUUID();
    const event = {
      id: eventId,
      type: eventType,
      entityType,
      entityId,
      performedBy: performedBy || 'system',
      timestamp: new Date().toISOString(),
      metadata: metadata || null,
    };
    
    const ref = db.collection("system_events").doc(eventId);
    if (transaction) {
      transaction.set(ref, event);
    } else {
      await ref.set(event);
    }
  }
}
