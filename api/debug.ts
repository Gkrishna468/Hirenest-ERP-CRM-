import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import * as fs from "fs";

function getAdminDb() {
  if (!getApps().length) {
    const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
    initializeApp({
      credential: applicationDefault(),
      projectId: config.projectId
    });
  }
  return getFirestore();
}

export default async function handler(req: any, res: any) {
  const db = getAdminDb();
  const collections = ["requirements", "jobs", "requirements_public", "requirements_private", "clients", "vendors", "candidates", "submissions"];
  const results: any = {};

  for (const col of collections) {
    try {
      const snap = await db.collection(col).limit(5).get();
      results[col] = {
        count: (await db.collection(col).count().get()).data().count,
        samples: snap.docs.map(d => ({ id: d.id, ...d.data() }))
      };
    } catch (err: any) {
      results[col] = { error: err.message };
    }
  }

  res.json(results);
}
