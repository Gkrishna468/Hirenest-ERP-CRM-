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
  const { collection: colName, docId, method, payload, query: queryParams } = req.body;
  const db = getAdminDb();

  try {
    if (method === "GET_DOC") {
      const snap = await db.collection(colName).doc(docId).get();
      if (!snap.exists) return res.status(404).json({ error: "Not found" });
      return res.json(snap.data());
    }

    if (method === "GET_DOCS") {
      let q: any = db.collection(colName);
      
      if (queryParams) {
        if (queryParams.where) {
          queryParams.where.forEach((w: any) => {
            q = q.where(w.field, w.op, w.value);
          });
        }
        if (queryParams.orderBy) {
          queryParams.orderBy.forEach((o: any) => {
            q = q.orderBy(o.field, o.direction || 'asc');
          });
        }
        if (queryParams.limit) {
          q = q.limit(queryParams.limit);
        }
      }
      
      const snap = await q.get();
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return res.json(docs);
    }

    if (method === "SET_DOC") {
      await db.collection(colName).doc(docId).set(payload, { merge: true });
      return res.json({ success: true });
    }

    if (method === "ADD_DOC") {
      const ref = await db.collection(colName).add(payload);
      return res.json({ id: ref.id });
    }

    if (method === "UPDATE_DOC") {
      await db.collection(colName).doc(docId).update(payload);
      return res.json({ success: true });
    }

    if (method === "DELETE_DOC") {
      await db.collection(colName).doc(docId).delete();
      return res.json({ success: true });
    }

    res.status(400).json({ error: "Invalid method" });
  } catch (error: any) {
    console.error(`[DB Proxy Error] ${method} on ${colName}:`, error);
    res.status(500).json({ error: error.message });
  }
}
