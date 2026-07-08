import { Router } from 'express';
import authHandler from '../controllers/auth';

const router = Router();

router.get('/google/url', async (req, res) => {
  req.query.action = 'url';
  try {
    await authHandler(req as any, res as any);
  } catch(e) {
    res.status(500).json({ error: "Internal Error" });
  }
});

router.get('/google/callback', async (req, res) => {
  req.query.action = 'callback';
  try {
    await authHandler(req as any, res as any);
  } catch(e) {
    res.status(500).json({ error: "Internal Error" });
  }
});

router.post('/users/reset-password', async (req, res) => {
  req.query.action = 'admin-reset-password';
  try {
    await authHandler(req as any, res as any);
  } catch(e) {
    res.status(500).json({ error: "Internal Error" });
  }
});

router.delete('/users/:targetUserId', async (req, res) => {
  req.query.action = 'admin-delete-user';
  req.body = { ...req.body, targetUserId: req.params.targetUserId };
  try {
    await authHandler(req as any, res as any);
  } catch(e) {
    res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
