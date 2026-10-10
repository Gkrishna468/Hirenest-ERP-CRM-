import { Router } from 'express';
import { getAdminDb } from '../utils/firebaseAdmin';
import { agentRuntime } from '../agents/AgentRuntime';

const router = Router();

router.get('/', async (req, res) => {
  const db = getAdminDb();
  let dbStatus: 'healthy' | 'degraded' | 'unavailable' = 'unavailable';
  let latencyMs = 0;
  
  const startTime = Date.now();
  try {
    if (db) {
      await db.collection('users').limit(1).get();
      latencyMs = Date.now() - startTime;
      dbStatus = latencyMs < 1000 ? 'healthy' : 'degraded';
    }
  } catch (e: any) {
    console.warn("[HealthCheck] Firestore probe failed:", e?.message);
    dbStatus = 'unavailable';
  }

  const activeAgents = agentRuntime.getRegisteredAgents();
  const agentStatus = activeAgents.length > 0 ? 'healthy' : 'degraded';

  const overallStatus = (dbStatus === 'healthy' && agentStatus === 'healthy') ? 'healthy' : (dbStatus === 'unavailable' ? 'unavailable' : 'degraded');
  const httpStatus = overallStatus === 'unavailable' ? 503 : 200;

  res.status(httpStatus).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION || '1.0.0-rc1',
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_REF || 'v1.0.0-rc1',
    components: {
      firestore: {
        status: dbStatus,
        latencyMs
      },
      authGateway: {
        status: 'healthy'
      },
      agentRuntime: {
        status: agentStatus,
        activeAgents
      }
    }
  });
});

export default router;
