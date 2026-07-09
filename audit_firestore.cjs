const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
});

const db = getFirestore();

const coreCollections = [
  "users", "organizations", "vendors", "clients", "requirements", "candidates"
];

function truncateValues(obj) {
  if (!obj) return obj;
  const copy = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      copy[key] = val.length > 100 ? val.substring(0, 100) + '...' : val;
    } else if (val && typeof val === 'object' && !Array.isArray(val) && typeof val.toDate !== 'function') {
      copy[key] = truncateValues(val);
    } else {
      copy[key] = val;
    }
  }
  return copy;
}

async function audit() {
  console.log("=== CORE FIRESTORE DATA AUDIT STARTS ===");
  for (const colName of coreCollections) {
    try {
      const colRef = db.collection(colName);
      const snap = await colRef.get();
      const totalCount = snap.size;
      
      console.log(`Collection: "${colName}" - Total Documents: ${totalCount}`);
      if (totalCount === 0) {
        console.log(`  -> EMPTY.\n`);
        continue;
      }

      const sampleDoc = snap.docs[0];
      const data = sampleDoc.data();
      const sampleId = sampleDoc.id;
      
      console.log(`  -> Sample Doc ID: ${sampleId}`);
      console.log(`  -> Sample Data:`, JSON.stringify(truncateValues(data), null, 2));
      
      // Look at organizationIds
      const orgIds = {};
      snap.docs.forEach(d => {
        const docData = d.data();
        const orgId = docData.organizationId !== undefined ? String(docData.organizationId) : "undefined";
        orgIds[orgId] = (orgIds[orgId] || 0) + 1;
      });
      console.log(`  -> organizationId distribution:`, orgIds);
      console.log("");
    } catch (err) {
      console.error(`Error auditing ${colName}:`, err.message);
    }
  }
  console.log("=== CORE AUDIT COMPLETE ===");
}

audit().catch(console.error);
