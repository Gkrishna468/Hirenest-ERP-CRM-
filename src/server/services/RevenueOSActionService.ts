import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import { executeAITask } from "@/utils/aiGateway";
import { accessControlService } from "./AccessControlService";
import { signalEngine } from "./SignalEngine";
import { nextBestActionEngine } from "./NextBestActionEngine";
import * as crypto from "crypto";

export class RevenueOSActionService {
  /**
   * Helper to resolve and validate tenant organizationId.
   * Throws 403 / Error if organizationId is missing or unauthorized.
   */
  private resolveTenantOrgId(userContext?: any): string {
    const orgId = userContext?.organizationId;
    if (!orgId) {
      if (userContext?.userId === "executive-root" || userContext?.id === "executive-root") {
        return "org_hirenest"; // Default trusted tenant for root
      }
      throw new Error("Unauthorized: Missing valid organization context for RevenueOS operation.");
    }
    return orgId;
  }

  /**
   * Helper to enforce service-level RBAC permissions.
   */
  private enforcePermission(userContext: any, requiredPermission: string) {
    if (userContext?.userId === "executive-root" || userContext?.id === "executive-root" || userContext?.role === "admin" || userContext?.isSuperAdmin) {
      return; // Admin / root bypasses permission checks
    }
    const permissions = userContext?.permissions || [];
    if (!permissions.includes(requiredPermission) && userContext?.role !== "Super Admin" && userContext?.role !== "Admin") {
      throw new Error(`Forbidden: Insufficient permission '${requiredPermission}' for this action.`);
    }
  }

  /**
   * P0: Automated Dormant Client Engine (Tenant, Permission & ABAC Resource Scoped)
   */
  async evaluateDormantClients(userContext?: any): Promise<{ evaluated: number; dormantFound: number; actionsCreated: number }> {
    const organizationId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "revenue_os.execute");

    const db = getAdminDb();
    const evaluationDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for idempotency
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clientsSnap = await db.collection("clients")
      .where("organizationId", "==", organizationId)
      .get();

    let evaluated = 0;
    let dormantFound = 0;
    let actionsCreated = 0;

    for (const docSnap of clientsSnap.docs) {
      const client = { id: docSnap.id, ...docSnap.data() } as any;

      // ABAC Resource-Level Authorization check
      const authCheck = await accessControlService.authorizeResourceAccess(userContext, "read", "client", client);
      if (!authCheck.allowed) {
        continue; // Skip unauthorized resources
      }

      evaluated++;

      if (client.status && ["Inactive", "Closed", "Archived"].includes(client.status)) {
        continue;
      }

      const lastInteractionDate = new Date(client.lastInteraction || client.updatedAt || client.createdAt || thirtyDaysAgo);
      if (lastInteractionDate < thirtyDaysAgo) {
        dormantFound++;

        const idempotencyKey = `DORMANT_CLIENT:${client.id}:${evaluationDate}`;
        const existingActionSnap = await db.collection("tasks")
          .where("idempotencyKey", "==", idempotencyKey)
          .where("organizationId", "==", organizationId)
          .get();

        if (!existingActionSnap.empty) {
          continue;
        }

        actionsCreated++;
        const taskId = crypto.randomUUID();
        const actionData = {
          id: taskId,
          idempotencyKey,
          title: `Reactivate Dormant Client: ${client.company || client.name || client.id}`,
          description: `Client has had no recorded interaction for over 30 days. Opportunity score and historical placement value warrant a check-in.`,
          entityType: "client",
          entityId: client.id,
          clientName: client.company || client.name,
          priority: "Medium",
          status: "Pending",
          channel: "Email / Call",
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          organizationId,
          assignedTo: client.assignedTo || userContext?.userId,
          createdAt: new Date().toISOString(),
          createdBy: "RevenueOS-Engine"
        };

        await db.collection("tasks").doc(taskId).set(actionData);

        await DomainEventPublisher.publish(
          "DORMANT_CLIENT_DETECTED",
          "client",
          client.id,
          userContext?.email || "RevenueOS-Engine",
          {
            clientId: client.id,
            clientName: client.company || client.name,
            lastInteraction: client.lastInteraction || client.updatedAt,
            actionId: taskId,
            organizationId
          }
        );
      }
    }

    return { evaluated, dormantFound, actionsCreated };
  }

  /**
   * P0: AI BDM Daily Command Center (Tenant & ABAC Resource Scoped)
   */
  async getBdmDailyCommandCenter(userContext?: any): Promise<any> {
    const organizationId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "revenue_os.read");

    const db = getAdminDb();
    
    const tasksSnap = await db.collection("tasks").where("organizationId", "==", organizationId).get();
    const tasks: any[] = [];
    for (const d of tasksSnap.docs) {
      const task = { id: d.id, ...d.data() };
      const authCheck = await accessControlService.authorizeResourceAccess(userContext, "read", "task", task);
      if (authCheck.allowed) {
        tasks.push(task);
      }
    }

    const reqsSnap = await db.collection("requirements").where("organizationId", "==", organizationId).get();
    const requirements: any[] = [];
    for (const d of reqsSnap.docs) {
      const req = { id: d.id, ...d.data() };
      const authCheck = await accessControlService.authorizeResourceAccess(userContext, "read", "requirement", req);
      if (authCheck.allowed) {
        requirements.push(req);
      }
    }

    const subsSnap = await db.collection("submissions").where("organizationId", "==", organizationId).get();
    const submissionJobIds = new Set<string>();
    for (const d of subsSnap.docs) {
      const sub = { id: d.id, ...d.data() };
      const authCheck = await accessControlService.authorizeResourceAccess(userContext, "read", "submission", sub);
      if (authCheck.allowed) {
        if (sub.jobId || sub.requirementId) {
          submissionJobIds.add(sub.jobId || sub.requirementId);
        }
      }
    }

    const urgentActions: any[] = [];
    const followUps: any[] = [];

    requirements.forEach((req: any) => {
      const hasSubs = submissionJobIds.has(req.id);
      const reqDate = new Date(req.createdAt || Date.now());
      const ageHours = (Date.now() - reqDate.getTime()) / (1000 * 60 * 60);

      if (!hasSubs && ageHours > 48) {
        urgentActions.push({
          id: `req-nosub-${req.id}`,
          title: `Requirement Stalled: ${req.title || req.role} (${req.clientName || 'Client'})`,
          reason: `Created ${Math.round(ageHours)} hours ago with zero candidate submissions.`,
          channel: "Sourcing / Matching",
          priority: "High",
          entityType: "requirement",
          entityId: req.id,
          createdAt: req.createdAt
        });
      }
    });

    tasks.forEach((t: any) => {
      if (t.status !== "Completed") {
        const item = {
          id: t.id,
          title: t.title,
          reason: t.description,
          channel: t.channel || "Call",
          priority: t.priority || "Medium",
          entityType: t.entityType || "client",
          entityId: t.entityId,
          createdAt: t.createdAt
        };

        if (t.priority === "High" || t.priority === "Urgent") {
          urgentActions.push(item);
        } else {
          followUps.push(item);
        }
      }
    });

    const signals = await signalEngine.evaluateSignals(organizationId, userContext);
    const nextBestActions = nextBestActionEngine.generateActions(signals);

    return {
      metrics: {
        urgentActionsCount: nextBestActions.filter(a => a.priority === "CRITICAL" || a.priority === "HIGH").length,
        followUpsCount: nextBestActions.filter(a => a.priority === "MEDIUM" || a.priority === "LOW").length,
        pipelineValue: "$1.4M",
        activeRequirements: requirements.length,
        signalsDetected: signals.length
      },
      signals,
      nextBestActions,
      urgentActions,
      followUps,
      aiSummary: `RevenueOS Signal & NBA Engines evaluated ${signals.length} authorized signals across your scope. Generated ${nextBestActions.length} deterministic next-best-actions.`
    };
  }

  /**
   * Inbound Communication Intent Classification & ABAC Gated Task Creation
   */
  async handleInboundCommunication(payload: { channel: string; senderId: string; senderName: string; content: string; organizationId?: string }, userContext?: any) {
    const organizationId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "communication.read");

    const eventId = crypto.randomUUID();
    let intentResult = {
      intent: "UNKNOWN",
      confidence: 0.5,
      extractedEntities: {},
      recommendedAction: "REVIEW",
      explanation: "Heuristic classification fallback."
    };

    try {
      const prompt = `
        Analyze the following inbound client message in a staffing & recruiting context.
        Classify intent into one of: NEW_REQUIREMENT, REQUIREMENT_UPDATE, INTERVIEW, CANDIDATE_STATUS, COMMERCIAL, FOLLOW_UP, GENERAL, UNKNOWN.
        Return ONLY valid JSON:
        {
          "intent": "...",
          "confidence": number (0-1),
          "extractedEntities": { "quantity": number, "skills": [], "location": "", "experience": "" },
          "recommendedAction": "CREATE_REQUIREMENT_REVIEW" | "UPDATE_STATUS" | "RESPOND" | "REVIEW",
          "explanation": "Brief explanation"
        }
        
        MESSAGE: "${payload.content}"
      `;

      const rawAiResponse = await executeAITask({
        agentName: "CommunicationAgent",
        prompt,
        metadata: { channel: payload.channel, organizationId }
      });

      const parsed = JSON.parse(rawAiResponse || "{}");
      if (parsed.intent) {
        intentResult = parsed;
      }
    } catch (aiErr) {
      console.warn("[RevenueOSActionService] AI Intent Gateway warning, using heuristic fallback:", aiErr);
      const lower = payload.content.toLowerCase();
      if (lower.includes("developer") || lower.includes("hiring") || lower.includes("urgent")) {
        intentResult.intent = "NEW_REQUIREMENT";
        intentResult.confidence = 0.90;
        intentResult.recommendedAction = "POTENTIAL_REQUIREMENT";
      }
    }

    await DomainEventPublisher.publish(
      "COMMUNICATION_RECEIVED",
      "communication",
      eventId,
      userContext?.email || payload.senderId,
      {
        organizationId,
        channel: payload.channel,
        senderName: payload.senderName,
        intent: intentResult.intent,
        confidence: intentResult.confidence
      }
    );

    let actionCreated = false;
    if (intentResult.intent === "NEW_REQUIREMENT" || intentResult.confidence < 0.95) {
      actionCreated = true;
      const recId = crypto.randomUUID();
      const db = getAdminDb();
      await db.collection("tasks").doc(recId).set({
        id: recId,
        idempotencyKey: `COMM_INTENT:${eventId}`,
        title: `AI Intent: ${intentResult.intent} from ${payload.senderName}`,
        description: `Inbound ${payload.channel} message classified as ${intentResult.intent} (Confidence: ${intentResult.confidence}): "${payload.content}"`,
        entityType: "communication",
        entityId: eventId,
        priority: intentResult.intent === "NEW_REQUIREMENT" ? "High" : "Medium",
        status: "PendingApproval",
        channel: payload.channel,
        organizationId,
        assignedTo: userContext?.userId,
        createdAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      eventId,
      intentClassification: intentResult,
      actionCreated
    };
  }
}

export const revenueOSActionService = new RevenueOSActionService();
