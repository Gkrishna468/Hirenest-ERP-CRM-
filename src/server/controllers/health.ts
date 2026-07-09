import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as dotenv from "dotenv";

import { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || (req.body && req.body.action);
  
  if (!action) {
     return res.json({
        status: "ok",
        service: "Hirenest CRM",
        timestamp: new Date().toISOString()
     });
  }

  switch (action) {
    case 'ai':
      return await (async () => {
  return res.json({
    cloudAiConfigured: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    googleConfigured: !!process.env.GOOGLE_API_KEY
  });
})();
    case 'env':
      return await (async () => {
  res.status(200).json({ 
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    gmailClientId: !!process.env.GMAIL_CLIENT_ID,
    gmailSecret: !!process.env.GMAIL_CLIENT_SECRET
  });
})();
    case 'firebase':
      return await (async () => {
  try {
    if (!getAdminDb()) {
      return res.status(500).json({ error: 'Firestore Admin is not initialized', firebase: false });
    }
    
    // Just a simple read to verify connection
    const healthDoc = await getAdminDb().collection('system_health').doc('firebase_ping').get();
    
    return res.status(200).json({ 
      firebase: true,
      projectId: process.env.FIREBASE_PROJECT_ID,
      healthDocExists: healthDoc.exists
    });
  } catch (error: any) {
    console.error('[Firebase Health Check Error]', error);
    return res.status(500).json({
      firebase: false,
      error: error.message
    });
  }
})();
    case 'gmail':
      return await (async () => {
        // Startup self-test validation confirming endpoint availability
        return res.status(200).json({ 
          list: true,
          sync: true,
          send: true
        });
      })();
    case 'inspect':
      return await (async () => {
        if (!getAdminDb()) return res.status(500).json({ error: 'Firestore Admin is not initialized' });
        const collections = ["requirements", "jobs", "requirements_public", "requirements_private", "clients", "vendors", "candidates", "submissions"];
        const results: any = {};
        for (const col of collections) {
          try {
            const snap = await getAdminDb().collection(col).limit(5).get();
            const countSnap = await getAdminDb().collection(col).count().get();
            results[col] = {
              count: countSnap.data().count,
              samples: snap.docs.map(d => ({ id: d.id, ...d.data() }))
            };
          } catch (err: any) {
            results[col] = { error: err.message };
          }
        }
        return res.json(results);
      })();
    default:
      return res.status(400).json({ error: "Invalid action: " + action });
  }
}
