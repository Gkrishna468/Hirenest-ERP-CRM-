import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class AccessControlService {
  /**
   * Helper to strictly resolve organizationId from trusted server-side context.
   */
  private resolveTenantOrgId(userContext?: any): string {
    const orgId = userContext?.organizationId;
    if (!orgId) {
      if (userContext?.userId === "executive-root" || userContext?.id === "executive-root" || userContext?.role === "admin") {
        return "org_hirenest";
      }
      throw new Error("Forbidden: Missing trusted organization context for Access Control operation.");
    }
    return orgId;
  }

  /**
   * Helper to enforce server-side RBAC permissions.
   */
  private enforcePermission(userContext: any, requiredPermission: string) {
    if (userContext?.userId === "executive-root" || userContext?.id === "executive-root" || userContext?.role === "admin" || userContext?.isSuperAdmin || userContext?.role === "Super Admin") {
      return; // Admin / root bypasses permission checks
    }
    const permissions = userContext?.permissions || [];
    if (!permissions.includes(requiredPermission)) {
      throw new Error(`Forbidden: Insufficient permission '${requiredPermission}' required for this action.`);
    }
  }

  /**
   * List users within organization, with role and scope details
   */
  async listUsers(userContext?: any): Promise<any[]> {
    const orgId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "users.read");

    const db = getAdminDb();
    const isRoot = userContext?.userId === "executive-root" || userContext?.role === "admin";

    let query: any = db.collection("users");
    if (!isRoot) {
      query = query.where("organizationId", "==", orgId);
    }

    const snap = await query.get();
    const users: any[] = [];
    snap.forEach((d: any) => users.push({ id: d.id, ...d.data() }));
    return users;
  }

  /**
   * Invite or create a user in the organization (Strictly scoped to trusted userContext orgId)
   */
  async createUser(data: any, performedBy: string, userContext?: any): Promise<any> {
    const orgId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "users.create");

    const db = getAdminDb();
    const userId = data.id || crypto.randomUUID();

    const userData = {
      id: userId,
      uid: userId,
      email: data.email,
      displayName: data.displayName || data.name || "New User",
      role: data.role || "Recruiter",
      organizationId: orgId, // MUST come exclusively from trusted userContext
      teamId: data.teamId || "default-team",
      status: data.status || "ACTIVE",
      scope: data.scope || "ASSIGNED",
      permissions: data.permissions || ["clients.read", "requirements.read", "candidates.read", "revenue_os.read", "revenue_os.recommend"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("users").doc(userId).set(userData);

    await DomainEventPublisher.publish(
      "USER_INVITED",
      "user",
      userId,
      performedBy,
      {
        targetUserId: userId,
        email: data.email,
        role: data.role,
        organizationId: orgId
      }
    );

    return userData;
  }

  /**
   * Update user role, permissions, or scope (Tenant & Permission Enforced)
   */
  async updateUser(userId: string, updates: any, performedBy: string, userContext?: any): Promise<any> {
    const orgId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "users.update");

    const db = getAdminDb();
    const ref = db.collection("users").doc(userId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("User not found");

    const oldData = snap.data();
    if (oldData?.organizationId !== orgId && userContext?.userId !== "executive-root") {
      throw new Error("Forbidden: Cannot modify users outside your organization.");
    }

    // Prevent organization tampering from client payloads
    const cleanUpdates = { ...updates };
    delete cleanUpdates.organizationId; // Cannot reassign tenant via update

    const updatedData = {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    };

    await ref.update(updatedData);

    await DomainEventPublisher.publish(
      "USER_ROLE_CHANGED",
      "user",
      userId,
      performedBy,
      {
        targetUserId: userId,
        oldRole: oldData?.role,
        newRole: updates.role || oldData?.role,
        oldPermissions: oldData?.permissions,
        newPermissions: updates.permissions || oldData?.permissions,
        organizationId: orgId
      }
    );

    return { id: userId, ...oldData, ...updatedData };
  }

  /**
   * Get Automation Policies for organization
   */
  async getAutomationPolicies(userContext?: any): Promise<any[]> {
    const orgId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "audit.read"); // or system.manage

    const db = getAdminDb();
    const snap = await db.collection("automation_policies")
      .where("organizationId", "==", orgId)
      .get();

    if (snap.empty) {
      const defaults = [
        { id: "pol-1", action: "followup.create", mode: "AUTOMATIC", requiredPermission: "revenue_os.execute", approvalRole: "None", organizationId: orgId },
        { id: "pol-2", action: "email.draft", mode: "AUTOMATIC", requiredPermission: "communication.draft", approvalRole: "None", organizationId: orgId },
        { id: "pol-3", action: "email.send", mode: "APPROVAL_REQUIRED", requiredPermission: "communication.email.send", approvalRole: "BDM", organizationId: orgId },
        { id: "pol-4", action: "whatsapp.send", mode: "APPROVAL_REQUIRED", requiredPermission: "communication.whatsapp.send", approvalRole: "BDM", organizationId: orgId },
        { id: "pol-5", action: "requirement.create_from_ai", mode: "APPROVAL_REQUIRED", requiredPermission: "requirements.create", approvalRole: "BDM", organizationId: orgId },
        { id: "pol-6", action: "deal.create", mode: "APPROVAL_REQUIRED", requiredPermission: "deals.create", approvalRole: "Finance", organizationId: orgId }
      ];

      for (const p of defaults) {
        await db.collection("automation_policies").doc(p.id).set(p);
      }
      return defaults;
    }

    const policies: any[] = [];
    snap.forEach(d => policies.push({ id: d.id, ...d.data() }));
    return policies;
  }

  /**
   * Update Automation Policy
   */
  async updateAutomationPolicy(policyId: string, mode: string, approvalRole: string, performedBy: string, userContext?: any): Promise<any> {
    const orgId = this.resolveTenantOrgId(userContext);
    this.enforcePermission(userContext, "roles.manage"); // Automation policy management requires roles.manage / system.manage

    const db = getAdminDb();
    const ref = db.collection("automation_policies").doc(policyId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Policy not found");

    if (snap.data()?.organizationId !== orgId && userContext?.userId !== "executive-root") {
      throw new Error("Forbidden: Cannot modify automation policies outside your organization.");
    }

    await ref.update({ mode, approvalRole, updatedAt: new Date().toISOString() });

    await DomainEventPublisher.publish(
      "AUTOMATION_POLICY_CHANGED",
      "policy",
      policyId,
      performedBy,
      { policyId, mode, approvalRole, organizationId: orgId }
    );

    return { success: true, policyId, mode, approvalRole };
  }

  /**
   * HireNest ABAC Authorization Engine v2
   * CAN(user, action, resourceType, resource)
   */
  async authorizeResourceAccess(
    userContext: any,
    action: string,
    resourceType: string,
    resource: any
  ): Promise<{ allowed: boolean; reason: string; scope: "GLOBAL" | "ORGANIZATION" | "TEAM" | "ASSIGNED" | "SELF" }> {
    if (!userContext || !userContext.organizationId) {
      await DomainEventPublisher.publish(
        "RESOURCE_ACCESS_DENIED",
        resourceType,
        resource?.id || "unknown",
        userContext?.email || "anonymous",
        { reason: "Missing authentication or organization context", action }
      );
      return { allowed: false, reason: "Missing authentication or organization context", scope: "ORGANIZATION" };
    }

    // 1. Tenant Check
    const resourceOrgId = resource?.organizationId || resource?.organization_id;
    if (resourceOrgId && resourceOrgId !== userContext.organizationId && userContext.userId !== "executive-root") {
      await DomainEventPublisher.publish(
        "CROSS_TENANT_ACCESS_ATTEMPT",
        resourceType,
        resource?.id || "unknown",
        userContext.email,
        { resourceOrgId, userOrgId: userContext.organizationId, action }
      );
      return { allowed: false, reason: "Cross-tenant access prohibited", scope: "ORGANIZATION" };
    }

    // 2. Determine User Scope
    const userRole = userContext.role || "Recruiter";
    const userScope = userContext.scope || (["Super Admin", "Founder", "admin"].includes(userRole) ? "GLOBAL" : "ASSIGNED");

    // 3. Evaluate Scope Rules
    if (userScope === "GLOBAL" || userContext.userId === "executive-root") {
      return { allowed: true, reason: "Global administrative access granted", scope: "GLOBAL" };
    }

    if (userScope === "ORGANIZATION") {
      return { allowed: true, reason: "Organization-level access granted", scope: "ORGANIZATION" };
    }

    if (userScope === "TEAM") {
      const resourceTeamId = resource?.teamId || resource?.team_id;
      if (resourceTeamId && resourceTeamId === userContext.teamId) {
        return { allowed: true, reason: "Team-level access granted", scope: "TEAM" };
      }
      await DomainEventPublisher.publish(
        "SCOPE_VIOLATION",
        resourceType,
        resource?.id || "unknown",
        userContext.email,
        { requiredScope: "TEAM", userTeam: userContext.teamId, resourceTeam: resourceTeamId, action }
      );
      return { allowed: false, reason: "Team scope violation", scope: "TEAM" };
    }

    if (userScope === "ASSIGNED") {
      const assignedUserId = resource?.assignedTo || resource?.assigned_to || resource?.bdmId || resource?.bdm_id || resource?.recruiterId || resource?.recruiter_id || resource?.ownerId || resource?.owner_id;
      if (assignedUserId && assignedUserId === userContext.userId) {
        return { allowed: true, reason: "Assigned resource access granted", scope: "ASSIGNED" };
      }
      await DomainEventPublisher.publish(
        "SCOPE_VIOLATION",
        resourceType,
        resource?.id || "unknown",
        userContext.email,
        { requiredScope: "ASSIGNED", userId: userContext.userId, assignedUserId, action }
      );
      return { allowed: false, reason: "Resource not assigned to user", scope: "ASSIGNED" };
    }

    if (userScope === "SELF") {
      const creatorId = resource?.createdBy || resource?.created_by || resource?.userId || resource?.user_id;
      if (creatorId && creatorId === userContext.userId) {
        return { allowed: true, reason: "Self-created resource access granted", scope: "SELF" };
      }
      await DomainEventPublisher.publish(
        "SCOPE_VIOLATION",
        resourceType,
        resource?.id || "unknown",
        userContext.email,
        { requiredScope: "SELF", userId: userContext.userId, creatorId, action }
      );
      return { allowed: false, reason: "Resource not owned by user", scope: "SELF" };
    }

    // Fail closed default
    return { allowed: false, reason: "Fail-closed: Scope not established", scope: "ASSIGNED" };
  }
}

export const accessControlService = new AccessControlService();
