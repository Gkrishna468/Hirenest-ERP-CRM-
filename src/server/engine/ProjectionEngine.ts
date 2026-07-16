import { DomainEvent } from "../events/DomainEventPublisher";
import { getAdminDb } from "../utils/firebaseAdmin";
import { Transaction } from "firebase-admin/firestore";

/**
 * The Projection Engine listens to Domain Events and builds read-only collections
 * for optimized querying across workspaces.
 * 
 * Collections maintained:
 * - candidatePool
 * - vendor_candidate_pool
 * - requirement_match_index
 */
export class ProjectionEngine {
  
  static async handleEvent(event: DomainEvent, transaction?: Transaction) {
    try {
      if (event.type.startsWith("CANDIDATE_")) {
        await this.projectCandidate(event, transaction);
      } else if (event.type.startsWith("REQUIREMENT_")) {
        await this.projectRequirement(event, transaction);
      }
    } catch (error) {
      console.error("[ProjectionEngine] Error handling event", event.id, error);
    }
  }

  private static async projectCandidate(event: DomainEvent, transaction?: Transaction) {
    const db = getAdminDb();
    const candidateId = event.aggregateId;
    const payload = event.payload;

    if (event.type === "CANDIDATE_ARCHIVED") {
      if (transaction) {
        transaction.delete(db.collection("candidatePool").doc(candidateId));
        transaction.delete(db.collection("vendor_candidate_pool").doc(candidateId));
      } else {
        await db.collection("candidatePool").doc(candidateId).delete();
        await db.collection("vendor_candidate_pool").doc(candidateId).delete();
      }
      return;
    }

    // Build the projected views
    const poolDoc = {
      id: candidateId,
      name: payload.name || "Unknown",
      title: payload.currentTitle || payload.title || "Unknown",
      skills: payload.skills || [],
      experience: payload.experience || "N/A",
      organizationId: payload.organizationId || event.organizationId || "bootstrap-org",
      vendorId: payload.vendorId || "",
      stage: payload.stage || "Available",
      status: payload.status || "active",
      updatedAt: event.timestamp
    };

    if (transaction) {
      transaction.set(db.collection("candidatePool").doc(candidateId), poolDoc, { merge: true });
      if (payload.vendorId) {
        transaction.set(db.collection("vendor_candidate_pool").doc(candidateId), poolDoc, { merge: true });
      }
    } else {
      await db.collection("candidatePool").doc(candidateId).set(poolDoc, { merge: true });
      if (payload.vendorId) {
        await db.collection("vendor_candidate_pool").doc(candidateId).set(poolDoc, { merge: true });
      }
    }
  }

  private static async projectRequirement(event: DomainEvent, transaction?: Transaction) {
    const db = getAdminDb();
    const requirementId = event.aggregateId;
    const payload = event.payload;

    if (event.type === "REQUIREMENT_ARCHIVED" || event.type === "REQUIREMENT_CLOSED") {
      if (transaction) {
        transaction.delete(db.collection("requirement_match_index").doc(requirementId));
      } else {
        await db.collection("requirement_match_index").doc(requirementId).delete();
      }
      return;
    }

    const reqDoc = {
      id: requirementId,
      title: payload.title || "Unknown",
      clientName: payload.clientName || "Unknown",
      skills: payload.skills || [],
      status: payload.status || "open",
      organizationId: payload.organizationId || event.organizationId || "bootstrap-org",
      updatedAt: event.timestamp
    };

    if (transaction) {
      transaction.set(db.collection("requirement_match_index").doc(requirementId), reqDoc, { merge: true });
    } else {
      await db.collection("requirement_match_index").doc(requirementId).set(reqDoc, { merge: true });
    }
  }
}
