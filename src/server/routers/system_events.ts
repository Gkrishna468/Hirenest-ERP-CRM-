import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const query = await db.collection("system_events").orderBy('timestamp', 'desc').limit(20).get();
    const items: any[] = [];
    query.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const data = req.body;
    await db.collection("system_events").doc(data.id).set(data);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/count/:collection', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const query = await db.collection(req.params.collection).count().get();
    res.status(200).json({ count: query.data().count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
