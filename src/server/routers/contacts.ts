import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const query = await db.collection("contacts").get();
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
    await db.collection("contacts").doc(data.id).set(data);
    await db.collection("system_events").doc().set({ eventType: "CREATED", entityCollection: "contacts", entityId: data.id, timestamp: new Date().toISOString() });
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const data = req.body;
    await db.collection("contacts").doc(req.params.id).update(data);
    await db.collection("system_events").doc().set({ eventType: "UPDATED", entityCollection: "contacts", entityId: req.params.id, timestamp: new Date().toISOString() });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
