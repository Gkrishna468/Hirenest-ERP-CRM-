export interface PolicyContext {
  organizationId: string;
  actorId: string;
  actionType: string;
}

export class PolicyEngine {
  async evaluate(context: PolicyContext, payload: any): Promise<{ allowed: boolean; reason?: string }> {
    console.log(`[PolicyEngine] Evaluating action ${context.actionType} for ${context.actorId}`);
    
    // Default allow for now. In production, evaluate against tenant-specific rules.
    return { allowed: true };
  }
}

export const policyEngine = new PolicyEngine();
