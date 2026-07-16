import { Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";
import * as crypto from "crypto";
import { ProjectionEngine } from "../engine/ProjectionEngine";

export interface DomainEvent {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  organizationId: string;

  actorId: string;
  actorRole: string;

  sourceApp: "CRM" | "OS" | "AI";
  sourceWorkspace: "Admin" | "Recruiter" | "Vendor" | "Client" | "System" | string;

  payload: Record<string, any>;

  correlationId: string;
  causationId?: string;

  timestamp: string;

  // Rich context-driven tracing fields
  userId?: string;
  vendorId?: string;
  clientId?: string;
  workspace?: string;
}

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
    
    // Map to DomainEvent and Trigger Projection Engine
    await ProjectionEngine.handleEvent({
      id: event.id,
      type: event.type,
      aggregateType: entityType,
      aggregateId: entityId,
      organizationId: metadata?.organizationId || "bootstrap-org",
      actorId: performedBy,
      actorRole: "System",
      sourceApp: "CRM",
      sourceWorkspace: "System",
      payload: metadata || {},
      correlationId: event.id,
      timestamp: event.timestamp
    } as any, transaction);
  }

  static async publishDomainEvent(
    event: Omit<DomainEvent, "id" | "timestamp" | "correlationId"> & { id?: string; timestamp?: string; correlationId?: string; userId?: string; vendorId?: string; clientId?: string; workspace?: string },
    transaction?: Transaction
  ) {
    const db = getAdminDb();
    const eventId = event.id || crypto.randomUUID();
    const timestamp = event.timestamp || new Date().toISOString();
    
    const fullEvent: DomainEvent = {
      id: eventId,
      type: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      organizationId: event.organizationId || "bootstrap-org",
      actorId: event.actorId || "system",
      actorRole: event.actorRole || "System",
      sourceApp: event.sourceApp || "CRM",
      sourceWorkspace: event.sourceWorkspace || "System",
      payload: event.payload || {},
      correlationId: event.correlationId || crypto.randomUUID(),
      causationId: event.causationId || "",
      timestamp,
      userId: event.userId || "",
      vendorId: event.vendorId || "",
      clientId: event.clientId || "",
      workspace: event.workspace || ""
    };

    const ref = db.collection("system_events").doc(eventId);
    if (transaction) {
      transaction.set(ref, fullEvent);
    } else {
      await ref.set(fullEvent);
    }

    return fullEvent;
  }
}

