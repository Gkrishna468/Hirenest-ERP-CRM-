import { accessControlService } from "../services/AccessControlService";

async function runAbacTests() {
  console.log("=== HIRENEST ABAC AUTHORIZATION ENGINE v2 TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  const testCases = [
    {
      name: "Test 1: BDM A accesses own assigned client -> ALLOW",
      user: { userId: "user-bdm-a", organizationId: "org-1", role: "BDM", scope: "ASSIGNED" },
      action: "read",
      resourceType: "client",
      resource: { id: "client-1", organizationId: "org-1", assignedTo: "user-bdm-a" },
      expected: true
    },
    {
      name: "Test 2: BDM A accesses BDM B's assigned client -> DENY",
      user: { userId: "user-bdm-a", organizationId: "org-1", role: "BDM", scope: "ASSIGNED" },
      action: "read",
      resourceType: "client",
      resource: { id: "client-2", organizationId: "org-1", assignedTo: "user-bdm-b" },
      expected: false
    },
    {
      name: "Test 3: BDM A accesses another organization -> DENY",
      user: { userId: "user-bdm-a", organizationId: "org-1", role: "BDM", scope: "ASSIGNED" },
      action: "read",
      resourceType: "client",
      resource: { id: "client-3", organizationId: "org-2", assignedTo: "user-bdm-a" },
      expected: false
    },
    {
      name: "Test 4: Team manager accesses team resource -> ALLOW",
      user: { userId: "mgr-1", organizationId: "org-1", teamId: "team-alpha", role: "Manager", scope: "TEAM" },
      action: "read",
      resourceType: "requirement",
      resource: { id: "req-1", organizationId: "org-1", teamId: "team-alpha" },
      expected: true
    },
    {
      name: "Test 5: Team member accesses another team's resource -> DENY",
      user: { userId: "member-1", organizationId: "org-1", teamId: "team-alpha", role: "Recruiter", scope: "TEAM" },
      action: "read",
      resourceType: "requirement",
      resource: { id: "req-2", organizationId: "org-1", teamId: "team-beta" },
      expected: false
    },
    {
      name: "Test 6: User accesses resource they created -> ALLOW under SELF",
      user: { userId: "rec-1", organizationId: "org-1", role: "Recruiter", scope: "SELF" },
      action: "read",
      resourceType: "candidate",
      resource: { id: "cand-1", organizationId: "org-1", createdBy: "rec-1" },
      expected: true
    },
    {
      name: "Test 7: User accesses resource created by another user -> DENY under SELF",
      user: { userId: "rec-1", organizationId: "org-1", role: "Recruiter", scope: "SELF" },
      action: "read",
      resourceType: "candidate",
      resource: { id: "cand-2", organizationId: "org-1", createdBy: "rec-2" },
      expected: false
    },
    {
      name: "Test 8: Admin accesses organization resources -> ALLOW",
      user: { userId: "admin-1", organizationId: "org-1", role: "Admin", scope: "ORGANIZATION" },
      action: "read",
      resourceType: "client",
      resource: { id: "client-4", organizationId: "org-1", assignedTo: "someone-else" },
      expected: true
    },
    {
      name: "Test 9: Vendor A accesses Vendor B candidate -> DENY",
      user: { userId: "vendor-a", organizationId: "org-vendor-a", role: "Vendor Admin", scope: "ASSIGNED" },
      action: "read",
      resourceType: "candidate",
      resource: { id: "cand-3", organizationId: "org-vendor-b", assignedTo: "vendor-b" },
      expected: false
    },
    {
      name: "Test 10: Client A accesses Client B requirement -> DENY",
      user: { userId: "client-a", organizationId: "org-client-a", role: "Client Admin", scope: "ORGANIZATION" },
      action: "read",
      resourceType: "requirement",
      resource: { id: "req-3", organizationId: "org-client-b" },
      expected: false
    },
    {
      name: "Test 11: Missing organizationId in user context -> DENY (Fail-closed)",
      user: { userId: "hacker-1" },
      action: "read",
      resourceType: "client",
      resource: { id: "client-1", organizationId: "org-1" },
      expected: false
    },
    {
      name: "Test 12: Tampered resource organizationId -> DENY",
      user: { userId: "bdm-1", organizationId: "org-1", role: "BDM", scope: "ASSIGNED" },
      action: "read",
      resourceType: "client",
      resource: { id: "client-1", organizationId: "org-2", assignedTo: "bdm-1" },
      expected: false
    }
  ];

  for (const tc of testCases) {
    try {
      const result = await accessControlService.authorizeResourceAccess(tc.user, tc.action, tc.resourceType, tc.resource);
      if (result.allowed === tc.expected) {
        console.log(`✅ [PASS] ${tc.name}`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${tc.name} (Expected ${tc.expected}, got ${result.allowed}: ${result.reason})`);
        failed++;
      }
    } catch (err: any) {
      if (!tc.expected) {
        console.log(`✅ [PASS] ${tc.name} (Threw expected error: ${err.message})`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${tc.name} (Threw unexpected error: ${err.message})`);
        failed++;
      }
    }
  }

  console.log(`\n=== ABAC TEST RESULTS ===`);
  console.log(`Total: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAbacTests();
