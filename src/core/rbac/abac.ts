/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core ABAC (Attribute-Based Access Control) Engine
 * Strict Organization Isolation & Scoped Entity Authorization
 * Universal Policy: RBAC/ABAC applies equally to Humans and AI
 */

import { ABACContext, PermissionAction } from '../types';
import { hasPermission } from './index';

export interface ABACDecision {
  allowed: boolean;
  reason?: string;
  evaluatedAt: string;
}

export class ABACEngine {
  static evaluate(action: PermissionAction, context: ABACContext): ABACDecision {
    const timestamp = new Date().toISOString();
    const { user, resource } = context;

    // 1. Base Active Status Check
    if (!user.active) {
      return {
        allowed: false,
        reason: 'User or Service Identity is deactivated',
        evaluatedAt: timestamp
      };
    }

    // 2. Base RBAC Check
    if (!hasPermission(user.role, action, user.permissions)) {
      return {
        allowed: false,
        reason: `Role '${user.role}' lacks base permission for action '${action}'`,
        evaluatedAt: timestamp
      };
    }

    // 3. Founders have universal root access across the tenant
    if (user.role === 'founder') {
      return { allowed: true, evaluatedAt: timestamp };
    }

    // 4. Strict Organization Isolation (Tenant Multi-tenancy)
    if (user.organizationId && resource.organizationId && user.organizationId !== resource.organizationId) {
      return {
        allowed: false,
        reason: `Cross-tenant access forbidden. User Org: ${user.organizationId}, Resource Org: ${resource.organizationId}`,
        evaluatedAt: timestamp
      };
    }

    // 5. Vendor Scoping & Vendor -> Recruiter Hierarchy
    if (user.role === 'vendor_admin' || user.role === 'vendor_recruiter') {
      if (!user.vendorId) {
        return {
          allowed: false,
          reason: 'Vendor user missing assigned vendorId claim',
          evaluatedAt: timestamp
        };
      }

      // Check Candidate / Submission ownership
      if (resource.type === 'candidate' || resource.type === 'submission') {
        if (resource.ownerVendorId && resource.ownerVendorId !== user.vendorId) {
          return {
            allowed: false,
            reason: 'Access denied: Resource belongs to a different Vendor Partner',
            evaluatedAt: timestamp
          };
        }
      }

      // Check Requirement authorization
      if (resource.type === 'requirement') {
        if (resource.authorizedVendorIds && !resource.authorizedVendorIds.includes(user.vendorId)) {
          return {
            allowed: false,
            reason: 'Requirement is not authorized or broadcasted to this Vendor Partner',
            evaluatedAt: timestamp
          };
        }
      }
    }

    // 6. Client Scoping
    if (user.role === 'client_admin' || user.role === 'client_member') {
      if (!user.clientId) {
        return {
          allowed: false,
          reason: 'Client user missing assigned clientId claim',
          evaluatedAt: timestamp
        };
      }

      if (resource.targetClientId && resource.targetClientId !== user.clientId) {
        return {
          allowed: false,
          reason: 'Access denied: Resource belongs to a different Client Account',
          evaluatedAt: timestamp
        };
      }
    }

    // 7. BDM / Recruiter Assigned Scoping
    if (user.role === 'bdm' && resource.assignedBdmId && resource.assignedBdmId !== user.uid) {
      // BDMs can read all accounts in their org, but updating requires assignment
      if (action.includes(':update') || action.includes(':delete')) {
        return {
          allowed: false,
          reason: 'BDM can only modify clients or opportunities assigned directly to them',
          evaluatedAt: timestamp
        };
      }
    }

    // 8. AI Agent Parity: AI is strictly prohibited from mutating without human-in-the-loop authorization
    if (user.isAiAgent || user.role === 'ai_agent') {
      if (action.includes(':create') || action.includes(':update') || action.includes(':delete') || action.includes(':approve')) {
        return {
          allowed: false,
          reason: 'AI Governance Law: AI models may analyze, score, recommend and draft, but cannot mutate operational state without Human Founder/Admin approval',
          evaluatedAt: timestamp
        };
      }
    }

    return {
      allowed: true,
      evaluatedAt: timestamp
    };
  }
}
