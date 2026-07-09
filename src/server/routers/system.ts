import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.get('/ingestion_telemetry', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const doc = await db.collection("ingestion_telemetry").doc("overall").get();
    res.status(200).json(doc.exists ? doc.data() : { 
      successfulUploads: 0, updates: 0, newCandidates: 0, duplicates: 0, conflicts: 0, 
      aiFailures: 0, averageParseTimeSec: "0", ollamaSuccessRate: 0, cloudAiFallbackRate: 0 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ai_reprocessing_queue', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const query = await db.collection("ai_reprocessing_queue").where("status", "==", "pending").get();
    const items: any[] = [];
    query.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    res.status(200).json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/migration_metrics', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const query = await db.collection("migration_metrics").orderBy('timestamp', 'desc').limit(5).get();
    const items: any[] = [];
    query.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    res.status(200).json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ingestion_executions', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const data = req.body;
    await db.collection("ingestion_executions").doc().set(data);
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
