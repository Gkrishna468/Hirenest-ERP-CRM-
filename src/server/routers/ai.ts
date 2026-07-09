import { Router } from 'express';
import aiHandler from '../controllers/ai';

const router = Router();

router.all('/:action', async (req, res) => {
  req.query.action = req.params.action;
  try {
    await aiHandler(req as any, res as any);
  } catch(e) {
    res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
