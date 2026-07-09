const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
});

async function run() {
    const db = getFirestore();
    const cols = await db.listCollections();
    for (let c of cols) {
        const snap = await c.limit(1).get();
        console.log(`Collection: ${c.id}, Count: ${snap.empty ? 0 : '> 0'}`);
    }
}
run();
