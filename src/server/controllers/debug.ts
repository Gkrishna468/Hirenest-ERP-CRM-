
import { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";

export default async function handler(req: any, res: any) {
  const db = getAdminDb();
  const collections = ["requirements", "jobs", "requirements_public", "requirements_private", "clients", "vendors", "candidates", "submissions"];
  const results: any = {};

  for (const col of collections) {
    try {
      const snap = await getAdminDb().collection(col).limit(5).get();
      results[col] = {
        count: (await getAdminDb().collection(col).count().get()).data().count,
        samples: snap.docs.map(d => ({ id: d.id, ...d.data() }))
      };
    } catch (err: any) {
      results[col] = { error: err.message };
    }
  }

  res.json(results);
}
