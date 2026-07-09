import re

with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

# Replace the isUpdate block in submitToPool
pattern = r"const isUpdate = !!candidateId;\s+if \(!isUpdate\) \{.*?createdAt: new Date\(\)\.toISOString\(\)\s+\}\);\s+\}"

replacement = """const isUpdate = !!candidateId;
      if (isUpdate) {
        const candRef = db.collection("candidates").doc(candidateId);
        transaction.update(candRef, {
          ...identityData,
          name: candidateName,
          updatedAt: new Date().toISOString(),
          syncVersion: FieldValue.increment(1)
        });
      } else {
        const candRef = db.collection("candidates").doc();
        candidateId = candRef.id;
        transaction.set(candRef, {
          name: candidateName,
          vendorId,
          stage: "Available",
          created_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          candidateHash: resumeHash || "NO_HASH",
          ...identityData
        });
        const identities = [];
        if (resumeHash) identities.push(resumeHash);
        if (identityData.email) identities.push(identityData.email.trim().toLowerCase());
        if (identityData.phone) identities.push(identityData.phone.replace(/[^0-9]/g, ''));
        
        transaction.set(db.collection("candidate_identity_vault").doc(), {
          identities,
          vendorId,
          candidateId,
          createdAt: new Date().toISOString()
        });
      }"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
