import re

with open('src/server/repositories/CandidateRepository.ts', 'r') as f:
    content = f.read()

new_method = '''  async findIdentityByHashEmailPhone(hash: string, email: string, phone: string): Promise<any> {
    const db = getAdminDb();
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
  }
'''

content = content.replace('  async findIdentityByEmailOrPhone(email: string, phone: string): Promise<any> {', new_method + '\n  async findIdentityByEmailOrPhone(email: string, phone: string): Promise<any> {')

with open('src/server/repositories/CandidateRepository.ts', 'w') as f:
    f.write(content)

