const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
});

const db = getFirestore();

async function migrate() {
    console.log("Starting migration to SSOT collections...");
    
    // 1. Migrate requirements_public & requirements_private -> requirements
    const reqPubSnap = await db.collection("requirements_public").get();
    const reqPrivSnap = await db.collection("requirements_private").get();
    
    const reqsMap = new Map();
    
    for (const doc of reqPubSnap.docs) {
        reqsMap.set(doc.id, { ...doc.data() });
    }
    for (const doc of reqPrivSnap.docs) {
        if (reqsMap.has(doc.id)) {
            reqsMap.set(doc.id, { ...reqsMap.get(doc.id), ...doc.data() });
        } else {
            reqsMap.set(doc.id, { ...doc.data() });
        }
    }
    
    let countReq = 0;
    const batchReq = db.batch();
    for (const [id, data] of reqsMap.entries()) {
        const ref = db.collection("requirements").doc(id);
        batchReq.set(ref, data, { merge: true });
        countReq++;
    }
    if (countReq > 0) await batchReq.commit();
    console.log(`Migrated ${countReq} requirements.`);

    // 2. Migrate organizations (type=client) -> clients
    const orgSnap = await db.collection("organizations").where("type", "==", "client").get();
    let countOrg = 0;
    const batchOrg = db.batch();
    for (const doc of orgSnap.docs) {
        const data = doc.data();
        const clientRef = db.collection("clients").doc(doc.id);
        batchOrg.set(clientRef, {
            company: data.companyName || data.name || '',
            name: data.companyName || data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            industry: data.industry || '',
            status: data.status || 'ACTIVE',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || new Date().toISOString()
        }, { merge: true });
        countOrg++;
    }
    if (countOrg > 0) await batchOrg.commit();
    console.log(`Migrated ${countOrg} clients.`);

    console.log("Migration complete.");
}

migrate().catch(console.error);
