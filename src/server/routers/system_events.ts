import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    let items: any[] = [];

    try {
      let queryRef: any = db.collection("system_events");
      
      if (req.query.entityType) {
        queryRef = queryRef.where('entityType', '==', req.query.entityType);
      }
      if (req.query.entityId) {
        queryRef = queryRef.where('entityId', '==', req.query.entityId);
      }
      if (req.query.actorId) {
        queryRef = queryRef.where('actorId', '==', req.query.actorId);
      }
      
      const query = await queryRef.orderBy('timestamp', 'desc').limit(100).get();
      query.forEach((doc: any) => {
        items.push({ id: doc.id, ...doc.data() });
      });
    } catch (queryErr: any) {
      console.warn("[system_events] Index query failed, using in-memory sort/filter fallback:", queryErr.message);
      let fallbackQuery: any = db.collection("system_events");
      if (req.query.entityType) {
        fallbackQuery = fallbackQuery.where('entityType', '==', req.query.entityType);
      } else if (req.query.entityId) {
        fallbackQuery = fallbackQuery.where('entityId', '==', req.query.entityId);
      } else {
        fallbackQuery = fallbackQuery.limit(200);
      }
      const fallbackSnap = await fallbackQuery.get();
      fallbackSnap.forEach((doc: any) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      
      if (req.query.entityType) {
        items = items.filter(it => it.entityType === req.query.entityType);
      }
      if (req.query.entityId) {
        items = items.filter(it => it.entityId === req.query.entityId);
      }
      if (req.query.actorId) {
        items = items.filter(it => it.actorId === req.query.actorId || it.userId === req.query.actorId || it.performedBy === req.query.actorId);
      }
      
      items.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      items = items.slice(0, 100);
    }

    res.status(200).json(items);
  } catch (error: any) {
    console.error("[system_events error]", error);
    res.status(200).json([]);
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
