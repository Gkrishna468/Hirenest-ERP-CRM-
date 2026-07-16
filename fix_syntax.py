import re

with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

content = content.replace(
'''        transaction.set(db.collection("candidate_identity_vault").doc(), {
          identities,
          vendorId,
          candidateId,
          createdAt: new Date().toISOString()
        });
      }

    const db = getAdminDb();''',
'''        transaction.set(db.collection("candidate_identity_vault").doc(), {
          identities,
          vendorId,
          candidateId,
          createdAt: new Date().toISOString()
        });
      }
      return { candidateId, isUpdate, reqId, assignedBdm, aiMatchScore, skillsList, candidateName };
    });

    const candidateId = txResult.candidateId;
    const isUpdate = txResult.isUpdate;
    const reqId = txResult.reqId;
    const assignedBdm = txResult.assignedBdm;
    const aiMatchScore = txResult.aiMatchScore;
    const skillsList = txResult.skillsList;
    
    // Redefine db for non-transactional calls
    const dbAdmin = getAdminDb();''')

# We need to change `const db = getAdminDb();` to `const txResult = await db.runTransaction...`
content = content.replace('return await db.runTransaction(async (transaction) => {', 'const txResult = await db.runTransaction(async (transaction) => {')

# Wait! The early return on line 16 (duplicate check) returns the object. We need to handle that.
content = content.replace(
'''      if (existingVaultDoc) {
        if (existingVaultDoc.vendorId !== vendorId) {
          return {
            status: 409,
            data: { 
              duplicate: true,
              reason: "OWNERSHIP_CONFLICT",
              ownerVendorId: existingVaultDoc.vendorId,
              action: "manual_review_required",
              message: `Ownership Conflict: This candidate is already registered by another partner.` 
            }
          };
        }
      }''',
'''      if (existingVaultDoc) {
        if (existingVaultDoc.vendorId !== vendorId) {
          return {
            _conflict: true,
            status: 409,
            data: { 
              duplicate: true,
              reason: "OWNERSHIP_CONFLICT",
              ownerVendorId: existingVaultDoc.vendorId,
              action: "manual_review_required",
              message: `Ownership Conflict: This candidate is already registered by another partner.` 
            }
          };
        }
      }''')

content = content.replace(
'''    const dbAdmin = getAdminDb();
    const matchRef = await db.collection("matches").add({''',
'''    const dbAdmin = getAdminDb();
    
    if (txResult._conflict) {
      return { status: txResult.status, data: txResult.data };
    }
    
    const matchRef = await dbAdmin.collection("matches").add({''')

# Fix submissionToPool if it has similar issue?
# "src/server/services/CandidateIngestionService.ts(127,3): error TS1005: ',' expected." is the error we got, let's see if this fixes it.

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
