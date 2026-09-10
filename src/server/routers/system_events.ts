import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    let items: any[] = [];
    
    // Dynamically adjust default limits to prevent massive payload sizes in polling
    const limitCount = (req.query.entityId || req.query.actorId) ? 100 : 30;

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
      
      const query = await queryRef.orderBy('timestamp', 'desc').limit(limitCount).get();
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
        fallbackQuery = fallbackQuery.limit(limitCount * 2);
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
      items = items.slice(0, limitCount);
    }

    // Sanitize and trim bulky fields from the items to reduce payload transmission size
    const sanitizedItems = items.map((item: any) => {
      if (!item) return item;
      
      // Ensure shallow copies to prevent side effects
      const copy = { ...item };
      
      if (copy.metadata) {
        const trimmedMeta: any = {};
        const keysToKeep = [
          'title', 'name', 'status', 'stage', 'clientName', 'clientId',
          'location', 'type', 'openings', 'vendorId', 'matchId',
          'candidateId', 'companyName', 'email', 'vendorName', 'expectedSalary',
          'budget', 'action', 'details', 'message'
        ];
        for (const key of keysToKeep) {
          if (copy.metadata[key] !== undefined) {
            let val = copy.metadata[key];
            if (typeof val === 'string' && val.length > 200) {
              val = val.substring(0, 200) + '... (truncated)';
            }
            trimmedMeta[key] = val;
          }
        }
        for (const [key, value] of Object.entries(copy.metadata)) {
          if (!keysToKeep.includes(key) && typeof value !== 'object' && String(value).length < 150) {
            trimmedMeta[key] = value;
          }
        }
        copy.metadata = trimmedMeta;
      }
      
      if (copy.payload) {
        const trimmedPayload: any = {};
        for (const [key, value] of Object.entries(copy.payload)) {
          if (typeof value !== 'object' && String(value).length < 150) {
            trimmedPayload[key] = value;
          }
        }
        copy.payload = trimmedPayload;
      }
      
      return copy;
    });

    res.status(200).json(sanitizedItems);
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
