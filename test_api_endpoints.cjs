const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
});

const db = getFirestore();

// Import services dynamically/directly or simulate them
const userContext = {
  userId: "0xpXdzSQE6V92xbnCkiczPHexiU2",
  email: "gopal@hirenestworkforce.com",
  role: "admin",
  organizationId: "ORG-GLOBAL-HQ",
  workspace: "Executive"
};

async function testEndpoint(name, fn) {
  console.log(`Testing: ${name}...`);
  try {
    const res = await fn();
    console.log(`  -> SUCCESS! Count: ${Array.isArray(res) ? res.length : 'N/A'}`);
    return { success: true, count: Array.isArray(res) ? res.length : 1 };
  } catch (err) {
    console.error(`  -> FAILURE! Error:`, err.message);
    if (err.stack) console.error(err.stack);
    return { success: false, error: err.message };
  }
}

// Replicate CandidateService list
async function listCandidates() {
  const snap = await db.collection("candidates").get();
  let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filter
  list = list.filter((item) => {
    if (userContext.userId === "executive-root") return true;
    
    // Tenant isolation
    if (userContext.organizationId && item.organizationId && item.organizationId !== userContext.organizationId) {
      return false;
    }

    // Role/Workspace-specific filtering
    if (userContext.workspace === "Vendor" && userContext.vendorId) {
      return item.vendorId === userContext.vendorId;
    }

    return true;
  });

  // Let's sort to see if sort crashes (like localeCompare on null/undefined)
  list.sort((a, b) => {
    // If CandidateService sorting crashes, let's see why
    return 0; 
  });

  return list;
}

// Replicate RequirementService list
async function listRequirements() {
  const snap = await db.collection("requirements").get();
  let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  list = list.filter((item) => {
    if (userContext.userId === "executive-root") return true;
    
    // Tenant isolation
    if (userContext.organizationId && item.organizationId && item.organizationId !== userContext.organizationId) {
      return false;
    }

    // Role/Workspace-specific filtering
    if (userContext.workspace === "Client" && userContext.clientId) {
      return item.clientId === userContext.clientId || item.companyId === userContext.clientId || item.accountId === userContext.clientId;
    }

    if (userContext.workspace === "Vendor") {
      return item.status === "open" || item.broadcast === true || item.status === "broadcast";
    }

    return true;
  });

  // Sort
  const compareDates = (aVal, bVal) => {
    const getMs = (val) => {
      if (!val) return 0;
      if (typeof val === 'string') {
        const parsed = Date.parse(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (val instanceof Date) {
        return val.getTime();
      }
      if (val && typeof val.toDate === 'function') {
        try {
          return val.toDate().getTime();
        } catch {
          // ignore
        }
      }
      if (val && typeof val.seconds === 'number') {
        return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
      }
      if (val && typeof val._seconds === 'number') {
        return val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000);
      }
      if (typeof val === 'number') {
        return val;
      }
      return 0;
    };
    return getMs(bVal) - getMs(aVal);
  };

  return list.sort((a, b) => compareDates(a.createdAt, b.createdAt));
}

// Replicate VendorService list
async function listVendors() {
  const snap = await db.collection("vendors").get();
  let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  list = list.filter((item) => {
    if (userContext.userId === "executive-root") return true;
    
    // Tenant isolation
    if (userContext.organizationId && item.organizationId && item.organizationId !== userContext.organizationId) {
      return false;
    }

    return true;
  });
  return list;
}

// Replicate ClientService list
async function listClients() {
  const firebaseClientsSnap = await db.collection("clients").get();
  const firebaseClients = firebaseClientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
  const existingIds = new Set(firebaseClients.map(c => c.id));
  const newExtracted = extractedClients.filter(c => !existingIds.has(c.id));
  const combined = [...firebaseClients, ...newExtracted];
  const seen = new Set();
  
  let unique = combined.filter(c => {
    if (!c.id || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  unique = unique.filter(c => {
    if (userContext.userId === "executive-root") return true;
    
    // Tenant isolation
    if (userContext.organizationId && c.organizationId && c.organizationId !== userContext.organizationId) {
      return false;
    }
    return true;
  });

  return unique;
}

// Replicate Pricing/Deals list
async function listDeals() {
  const snap = await db.collection("deals").get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function run() {
  console.log("=== START SERVICE DIAGNOSTIC ===");
  await testEndpoint("Clients", listClients);
  await testEndpoint("Vendors", listVendors);
  await testEndpoint("Requirements", listRequirements);
  await testEndpoint("Candidates", listCandidates);
  await testEndpoint("Deals", listDeals);
  console.log("=== END SERVICE DIAGNOSTIC ===");
}

run().catch(console.error);
