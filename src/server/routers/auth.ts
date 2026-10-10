import { Router } from 'express';
import authHandler from '../controllers/auth';
import { userService } from '../services/UserService';

const router = Router();

router.get('/workspace-context', (req, res) => {
  if (!(req as any).workspaceContext) {
    return res.status(401).json({ error: "No active workspace context" });
  }
  res.status(200).json((req as any).workspaceContext);
});

router.get('/me', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let userProfile = await userService.getById(userId);
    if (!userProfile) {
      const email = req.user?.email || 'user@hirenestworkforce.com';
      const isAdminEmail = userId === 'executive-root' || email === 'gopalkrishna0046@gmail.com' || email === 'gopal@hirenestworkforce.com' || email === 'admin@hirenestworkforce.com';
      const role = isAdminEmail ? 'admin' : 'recruiter';
      const newUserData = {
        id: userId,
        uid: userId,
        email,
        name: email.split('@')[0],
        role,
        organizationId: 'bootstrap-org',
        status: 'active',
        permissions: isAdminEmail ? ['*'] : ['recruiter:read', 'recruiter:write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await userService.create(newUserData, 'System');
      userProfile = await userService.getById(userId);
    }
    if (userProfile && (userProfile.email === 'gopal@hirenestworkforce.com' || userProfile.email === 'gopalkrishna0046@gmail.com' || userProfile.email === 'admin@hirenestworkforce.com') && userProfile.role !== 'admin') {
      await userService.update(userId, { role: 'admin' });
      userProfile.role = 'admin';
    }
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.status(200).json({
      user: userProfile,
      workspaceContext: req.workspaceContext
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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
