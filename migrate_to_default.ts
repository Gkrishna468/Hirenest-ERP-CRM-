import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

async function run() {
  const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
  
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
  });
  
  const sourceDb = getFirestore(app, config.firestoreDatabaseId);
  const targetDb = getFirestore(app); // default

  const collections = [
    "users", "organizations", "vendors", "clients", "requirements", 
    "candidates", "candidate_identity_vault", "vendor_candidate_pool", 
    "candidate_versions", "candidate_activity", "candidate_availability", 
    "submissions", "emails", "system_events", "system_logs", "dealRooms",
    "jobs", "deals", "agent_tasks", "agent_executions", "agent_logs", "broadcasts"
  ];

  console.log("Starting one-time migration to default database...");
  let totalDocs = 0;
  
  for (const col of collections) {
    console.log(`Migrating ${col}...`);
    try {
      const snap = await sourceDb.collection(col).get();
      if (snap.empty) {
        console.log(`  Skipping ${col}: Empty`);
        continue;
      }
      
      const batch = targetDb.batch();
      let count = 0;
      
      for (const doc of snap.docs) {
        const targetRef = targetDb.collection(col).doc(doc.id);
        batch.set(targetRef, doc.data());
        count++;
        
        if (count % 400 === 0) {
          await batch.commit();
          console.log(`  Committed ${count} docs to ${col}...`);
        }
      }
      
      if (count % 400 !== 0) {
        await batch.commit();
      }
      
      console.log(`  Finished ${col}: ${count} documents copied.`);
      totalDocs += count;
    } catch (e: any) {
      console.error(`  Error migrating ${col}:`, e.message);
    }
  }
  
  console.log(`Migration complete. Copied ${totalDocs} documents to (default).`);
}

run().catch(console.error);
