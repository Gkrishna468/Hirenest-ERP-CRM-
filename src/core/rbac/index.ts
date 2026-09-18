/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core RBAC Engine
 * Foundation: Unified Role & Permission Matrix
 */

import { UserRole, PermissionAction } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  founder: [
    'client:create', 'client:read', 'client:update', 'client:delete', 'client:export',
    'requirement:create', 'requirement:read', 'requirement:update', 'requirement:close', 'requirement:publish', 'requirement:assign',
    'vendor:create', 'vendor:read', 'vendor:update', 'vendor:authorize', 'vendor:bench_upload',
    'recruiter:create', 'recruiter:read', 'recruiter:assign', 'recruiter:performance',
    'candidate:create', 'candidate:read', 'candidate:update', 'candidate:ingest', 'candidate:redepoly',
    'submission:create', 'submission:read', 'submission:review', 'submission:accept', 'submission:reject',
    'interview:schedule', 'interview:read', 'interview:feedback', 'interview:reschedule',
    'offer:create', 'offer:read', 'offer:approve', 'offer:accept', 'offer:decline',
    'placement:create', 'placement:read', 'placement:invoice',
    'revenue:read', 'revenue:modify', 'revenue:forecast',
    'ai:analyze', 'ai:score', 'ai:recommend', 'ai:draft', 'ai:execute_with_human_approval',
    'settings:manage', 'audit:read', 'users:manage'
  ],
  admin: [
    'client:create', 'client:read', 'client:update', 'client:export',
    'requirement:create', 'requirement:read', 'requirement:update', 'requirement:close', 'requirement:publish', 'requirement:assign',
    'vendor:create', 'vendor:read', 'vendor:update', 'vendor:authorize', 'vendor:bench_upload',
    'recruiter:create', 'recruiter:read', 'recruiter:assign', 'recruiter:performance',
    'candidate:create', 'candidate:read', 'candidate:update', 'candidate:ingest', 'candidate:redepoly',
    'submission:create', 'submission:read', 'submission:review', 'submission:accept', 'submission:reject',
    'interview:schedule', 'interview:read', 'interview:feedback', 'interview:reschedule',
    'offer:create', 'offer:read', 'offer:approve', 'offer:accept', 'offer:decline',
    'placement:create', 'placement:read', 'placement:invoice',
    'revenue:read', 'revenue:forecast',
    'ai:analyze', 'ai:score', 'ai:recommend', 'ai:draft', 'ai:execute_with_human_approval',
    'settings:manage', 'audit:read', 'users:manage'
  ],
  bdm: [
    'client:create', 'client:read', 'client:update',
    'requirement:create', 'requirement:read', 'requirement:update', 'requirement:publish',
    'candidate:read',
    'submission:read', 'submission:review',
    'interview:read',
    'offer:read',
    'placement:read',
    'revenue:read',
    'ai:analyze', 'ai:score', 'ai:recommend', 'ai:draft'
  ],
  recruiter: [
    'client:read',
    'requirement:read',
    'vendor:read',
    'candidate:create', 'candidate:read', 'candidate:update', 'candidate:ingest', 'candidate:redepoly',
    'submission:create', 'submission:read',
    'interview:schedule', 'interview:read', 'interview:feedback', 'interview:reschedule',
    'offer:read',
    'placement:read',
    'ai:analyze', 'ai:score', 'ai:recommend', 'ai:draft'
  ],
  vendor_admin: [
    'requirement:read',
    'vendor:read', 'vendor:update', 'vendor:bench_upload',
    'candidate:create', 'candidate:read', 'candidate:update', 'candidate:ingest',
    'submission:create', 'submission:read',
    'interview:read',
    'offer:read',
    'placement:read',
    'ai:analyze', 'ai:score', 'ai:draft'
  ],
  vendor_recruiter: [
    'requirement:read',
    'candidate:create', 'candidate:read', 'candidate:ingest',
    'submission:create', 'submission:read',
    'interview:read',
    'ai:analyze'
  ],
  client_admin: [
    'client:read', 'client:update',
    'requirement:create', 'requirement:read', 'requirement:update', 'requirement:close',
    'submission:read', 'submission:accept', 'submission:reject',
    'interview:schedule', 'interview:read', 'interview:feedback',
    'offer:create', 'offer:read', 'offer:approve',
    'placement:read',
    'ai:analyze', 'ai:draft'
  ],
  client_member: [
    'requirement:read',
    'submission:read',
    'interview:read', 'interview:feedback'
  ],
  ai_agent: [
    'client:read',
    'requirement:read',
    'vendor:read',
    'candidate:read',
    'submission:read',
    'interview:read',
    'ai:analyze', 'ai:score', 'ai:recommend', 'ai:draft'
    // Explicitly NO autonomous write/execute permissions without human approval
  ],
  viewer: [
    'client:read',
    'requirement:read',
    'candidate:read',
    'submission:read',
    'interview:read',
    'placement:read'
  ]
};

export function hasPermission(role: UserRole, action: PermissionAction, explicitPermissions: string[] = []): boolean {
  if (role === 'founder') return true;
  if (explicitPermissions.includes(action) || explicitPermissions.includes('*')) return true;
  const roleActions = ROLE_PERMISSIONS[role] || [];
  return roleActions.includes(action);
}
