/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core Security & RBAC Audit Logger
 * Emits authorization and security decisions to the immutable Company Ledger (system_events)
 */

import { ABACDecision } from './abac';
import { PermissionAction, ABACContext } from '../types';

export class AuditLogger {
  static async logAuthorizationDecision(
    action: PermissionAction,
    context: ABACContext,
    decision: ABACDecision
  ): Promise<void> {
    const auditRecord = {
      id: `audit-${crypto.randomUUID()}`,
      eventType: decision.allowed ? 'AUTHORIZATION_GRANTED' : 'AUTHORIZATION_DENIED',
      aggregateType: 'SecurityPolicy',
      action,
      actorId: context.user.uid,
      actorEmail: context.user.email,
      actorRole: context.user.role,
      isAiAgent: !!context.user.isAiAgent,
      organizationId: context.user.organizationId,
      resourceType: context.resource.type,
      resourceId: context.resource.id,
      allowed: decision.allowed,
      reason: decision.reason || 'Authorized by Core Policy Engine',
      timestamp: decision.evaluatedAt,
      sourceApp: context.environment?.domain || 'CORE'
    };

    // Only log security denials or privileged role mutations to keep ledger lean
    if (!decision.allowed || action.includes('delete') || action.includes('approve') || action.includes('users:manage')) {
      try {
        if (typeof window !== 'undefined') {
          // Client-side trigger
          fetch('/api/system_events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditRecord)
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('[AuditLogger] Non-blocking audit record dispatch failed:', err);
      }
    }
  }
}
