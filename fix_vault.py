import re

with open('src/server/repositories/CandidateRepository.ts', 'r') as f:
    content = f.read()

replacement = """async findIdentityByHashEmailPhone(hash: string, email: string, phone: string): Promise<any> {
    const db = getAdminDb();
    
    // Check Identity Vault first
    let vaultMatch = null;
    if (hash && hash !== "NO_HASH") {
      const q = await db.collection("candidate_identity_vault").where("identities", "array-contains", hash).get();
      if (!q.empty) vaultMatch = q.docs[0].data();
    }
    if (!vaultMatch && email) {
      const q = await db.collection("candidate_identity_vault").where("identities", "array-contains", email.trim().toLowerCase()).get();
      if (!q.empty) vaultMatch = q.docs[0].data();
    }
    if (!vaultMatch && phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const q = await db.collection("candidate_identity_vault").where("identities", "array-contains", cleanPhone).get();
      if (!q.empty) vaultMatch = q.docs[0].data();
    }
    
    if (vaultMatch) {
      const candRef = await db.collection("candidates").doc(vaultMatch.candidateId).get();
      if (candRef.exists) return { id: candRef.id, ...candRef.data() };
    }

    // Fallback to old candidates collection
    if (hash && hash !== "NO_HASH") {
      const hashQuery = await db.collection("candidates").where("candidateHash", "==", hash).get();
      if (!hashQuery.empty) return { id: hashQuery.docs[0].id, ...hashQuery.docs[0].data() };
    }
    if (email) {
      const emailQuery = await db.collection("candidates").where("email", "==", email).get();
      if (!emailQuery.empty) return { id: emailQuery.docs[0].id, ...emailQuery.docs[0].data() };
    }
    if (phone) {
      const phoneQuery = await db.collection("candidates").where("phone", "==", phone).get();
      if (!phoneQuery.empty) return { id: phoneQuery.docs[0].id, ...phoneQuery.docs[0].data() };
    }
    return null;
  }"""

pattern = r"async findIdentityByHashEmailPhone.*?return null;\n  \}"
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/server/repositories/CandidateRepository.ts', 'w') as f:
    f.write(content)
