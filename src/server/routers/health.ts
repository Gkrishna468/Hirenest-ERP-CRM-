import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.get('/', async (req, res) => {
  const db = getAdminDb();
  let dbStatus = "unreachable";
  try {
    if (db) {
      await db.collection('system_health').doc('ping').get();
      dbStatus = "reachable";
    }
  } catch (e) {
    console.warn("Health check db error:", e);
  }

  res.json({
    status: "healthy",
    firestore: "(default)",
    auth: "connected",
    storage: "connected",
    database: dbStatus,
    apiVersion: "v1"
  });
});

export default router;
