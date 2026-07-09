const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
});

const db = getFirestore();

// Replicating clientService.list logic with logs
async function test() {
  const userContext = {
    userId: "0xpXdzSQE6V92xbnCkiczPHexiU2",
    email: "gopal@hirenestworkforce.com",
    role: "admin",
    organizationId: "ORG-GLOBAL-HQ",
    workspace: "Executive"
  };

  console.log("Simulating ClientService.list with userContext:", userContext);

  // 1. findAll clients from repository
  const firebaseClientsSnap = await db.collection("clients").get();
  const firebaseClients = firebaseClientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Found ${firebaseClients.length} firebase clients:`, firebaseClients.map(c => ({ id: c.id, company: c.company, organizationId: c.organizationId })));

  // 2. listUsers
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const orgNames = new Map();
  users.forEach((data) => {
    if (data.organizationId) {
      let name = data.companyName;
      if (!name && data.email) {
         const domain = data.email.split('@')[1];
         if (domain && domain !== 'gmail.com' && domain !== 'yahoo.com' && domain !== 'outlook.com') {
           name = domain.split('.')[0];
           name = name.charAt(0).toUpperCase() + name.slice(1);
         }
      }
      if (name) orgNames.set(data.organizationId, name);
    }
  });

  // 3. listRequirements
  const reqsSnap = await db.collection("requirements").get();
  const reqsDocs = reqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const reqsClientsMap = new Map();
  reqsDocs.forEach((data) => {
    const clientId = data.clientId || data.client_id;
    let clientName = data.clientName || data.client_name;
    if (!clientName && clientId) {
      clientName = orgNames.get(clientId) || `Client ${clientId.slice(-5)}`;
    }
    if (clientId && !reqsClientsMap.has(clientId)) {
      reqsClientsMap.set(clientId, {
        id: clientId,
        company: clientName,
        name: clientName,
        email: '',
        phone: '',
        location: '',
        industry: '',
        budget: 'Medium',
        contactPerson: '',
        website: '',
        clientCode: clientId,
        notes: 'Extracted from Requirements (OS)',
        userId: '',
        companyId: clientId,
        organizationId: data.organizationId || "bootstrap-org",
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
        source: 'os'
      });
    }
  });

  const extractedClients = Array.from(reqsClientsMap.values());
  console.log(`Found ${extractedClients.length} extracted clients from requirements:`, extractedClients.map(c => ({ id: c.id, company: c.company, organizationId: c.organizationId })));

  const existingIds = new Set(firebaseClients.map(c => c.id));
  const newExtracted = extractedClients.filter(c => !existingIds.has(c.id));
  const combined = [...firebaseClients, ...newExtracted];
  const seen = new Set();
  
  let unique = combined.filter(c => {
    if (!c.id || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  console.log(`Combined unique clients before filter: ${unique.length}`, unique.map(c => ({ id: c.id, organizationId: c.organizationId })));

  // Apply context-based filtering
  unique = unique.filter(c => {
    if (userContext.userId === "executive-root") return true;
    
    // Tenant isolation
    if (userContext.organizationId && c.organizationId && c.organizationId !== userContext.organizationId) {
      console.log(`  -> Filtered out client ${c.id}: organizationId mismatch (${c.organizationId} !== ${userContext.organizationId})`);
      return false;
    }

    // Role-based filtering
    if (userContext.workspace === "Client" && userContext.clientId) {
      const match = c.id === userContext.clientId || c.companyId === userContext.clientId;
      if (!match) console.log(`  -> Filtered out client ${c.id}: role-based client mismatch`);
      return match;
    }

    return true;
  });

  console.log(`Final filtered unique clients count: ${unique.length}`, unique.map(c => ({ id: c.id, company: c.company, organizationId: c.organizationId })));
}

test().catch(console.error);
