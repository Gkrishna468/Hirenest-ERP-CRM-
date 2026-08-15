import { getAdminDb } from "../utils/firebaseAdmin";

export interface UserActivityEvent {
  userId: string;
  userEmail: string;
  userRole: string;
  eventType: "LOGIN" | "SUBMISSION" | "INTERVIEW_SCHEDULED" | "OFFER_ISSUED" | "PLACEMENT_CREATED" | "REQUIREMENT_CREATED" | "SCREENING_OVERRIDE" | "OTHER";
  description: string;
  timestamp: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export class UserActivityService {
  private static instance: UserActivityService;

  private constructor() {}

  public static getInstance(): UserActivityService {
    if (!UserActivityService.instance) {
      UserActivityService.instance = new UserActivityService();
    }
    return UserActivityService.instance;
  }

  /**
   * Log user activity event to user_activity_events Firestore collection
   * and append to immutable ledger system_events.
   */
  public async logActivity(event: Omit<UserActivityEvent, "timestamp">): Promise<void> {
    const db = getAdminDb();
    if (!db) {
      console.warn("[UserActivityService] Database not initialized. Skipping activity logging.");
      return;
    }

    const timestamp = new Date().toISOString();
    const fullEvent: UserActivityEvent = {
      ...event,
      timestamp,
    };

    try {
      // 1. Write to user_activity_events
      await db.collection("user_activity_events").add(fullEvent);

      // 2. Append to Company Ledger (system_events) - Law 1: append-only, immutable
      const systemEventRef = db.collection("system_events").doc();
      await systemEventRef.set({
        eventId: systemEventRef.id,
        eventType: `USER_${fullEvent.eventType}`,
        timestamp,
        actorId: fullEvent.userId,
        actorEmail: fullEvent.userEmail,
        actorRole: fullEvent.userRole,
        organizationId: fullEvent.organizationId || "default",
        payload: {
          description: fullEvent.description,
          metadata: fullEvent.metadata || {},
        },
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
      });

      console.log(`[UserActivityService] Successfully logged user activity: ${fullEvent.eventType}`);
    } catch (error) {
      console.error("[UserActivityService] Failed to log user activity:", error);
    }
  }
}

export const userActivityService = UserActivityService.getInstance();
