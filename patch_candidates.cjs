const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'api/candidates.ts');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '} else if (action === "submitVendorCandidatePool") {';
const endMarker = '} else if (action === "reprocessAiQueue") {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found');
    console.log('startIndex:', startIndex);
    console.log('endIndex:', endIndex);
    process.exit(1);
}

const newBlock = `} else if (action === "submitVendorCandidatePool") {
    try {
      if (!db) throw new Error("Database not initialized");

      const { candidateHash, vendorId, candidateName, identityData } = req.body;

      if (!vendorId || !candidateName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1. Ensure reliable identityHash (Law 2: SSOT)
      const reliableHash = computeIdentityHash(identityData, candidateHash || "NO_HASH");

      // 2. FIRESTORE TRANSACTION FLOW (Law 1 & Law 5)
      const vaultRef = db.collection("candidate_identity_vault");
      
      const result = await db.runTransaction(async (transaction) => {
        const existingQuery = await transaction.get(vaultRef.where("candidateHash", "==", reliableHash).limit(1));
        
        let existingVaultDoc = null;
        if (!existingQuery.empty) {
          existingVaultDoc = { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() };
        }

        if (existingVaultDoc) {
          if (existingVaultDoc.vendorId !== vendorId) {
            // Ownership Conflict
            return {
              status: 409,
              data: { 
                duplicate: true,
                reason: "ownership_conflict",
                existingVendorId: existingVaultDoc.vendorId,
                action: "manual_review_required",
                error: "Candidate Ownership Conflict", 
                message: "This profile is already locked under prior registry claims by another vendor." 
              }
            };
          }
        }

        const parsedTitle = identityData.current_title || identityData.currentTitle || "Software Engineer";
        const parsedSkills = identityData.skills || [];
        const parsedSummary = identityData.cover_note || "Vetted talent pool candidate.";
        const fraudDetected = !!identityData.fraudDetected;

        let candidateId = existingVaultDoc ? existingVaultDoc.candidateId : null;

        if (!candidateId) {
           const candRef = db.collection("candidates").doc();
           candidateId = candRef.id;
           transaction.set(candRef, {
             name: candidateName,
             vendorId: vendorId,
             vendor_company_id: vendorId,
             stage: "Available",
             source: "vendor_pool",
             created_at: new Date().toISOString(),
             updatedAt: new Date().toISOString(),
             assignedBdm: "Ravi",
             aiMatchScore: 85,
             fraudDetected,
             notes: parsedSummary,
             skills: parsedSkills,
             organizationId: vendorId,
             ownerType: "Vendor",
             ownerUserId: vendorId,
             submittedVia: "Vendor Pool",
             ownershipLocked: true,
             candidateHash: reliableHash,
             syncVersion: 1,
             ...identityData
           });
        } else {
           transaction.update(db.collection("candidates").doc(candidateId), {
             name: candidateName,
             skills: parsedSkills,
             currentTitle: parsedTitle,
             updatedAt: new Date().toISOString(),
             syncVersion: FieldValue.increment(1),
             ...identityData
           });
        }

        if (!existingVaultDoc) {
          const newVaultRef = db.collection("candidate_identity_vault").doc();
          transaction.set(newVaultRef, {
            candidateHash: reliableHash,
            vendorId,
            candidateName,
            candidateId,
            ownershipLocked: true,
            createdAt: new Date().toISOString()
          });
          
          transaction.set(db.collection("candidateOwnership").doc(), {
            candidateHash: reliableHash,
            vendorId,
            candidateName,
            createdAt: new Date().toISOString(),
            source: "vendor",
            identityData,
          });
        } else if (!existingVaultDoc.candidateId) {
           transaction.update(db.collection("candidate_identity_vault").doc(existingVaultDoc.id), {
             candidateId,
             updatedAt: new Date().toISOString()
           });
        }

        // Sync to Vendor Pool
        transaction.set(db.collection("vendor_candidate_pool").doc(candidateId), {
          name: candidateName,
          vendorId,
          stage: "Available",
          currentTitle: parsedTitle,
          skills: parsedSkills,
          updatedAt: new Date().toISOString(),
          candidateId,
          candidateHash: reliableHash,
          syncVersion: FieldValue.increment(1),
          ...identityData
        }, { merge: true });

        // Ledger Entry
        transaction.set(db.collection("system_events").doc(), {
          type: "CANDIDATE_POOL_SYNCED",
          message: "Vendor synced candidate " + candidateName + " in Talent Pool.",
          timestamp: new Date().toISOString(),
          entityType: "vendor_candidate",
          entityId: candidateId,
          data: { candidateName, vendorId, candidateHash: reliableHash }
        });

        return { status: 200, data: { success: true, candidateId } };
      });

      return res.status(result.status).json(result.data);

    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  `;

const updatedContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);

fs.writeFileSync(filePath, updatedContent);
console.log('Successfully updated api/candidates.ts');
