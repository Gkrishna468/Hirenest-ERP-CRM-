import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { requireAuth } from "./src/server/controllers/authMiddleware";
import healthRouter from "./src/server/routers/health";
import vendorsRouter from "./src/server/routers/vendors";
import healthHandler from "./src/server/controllers/health";
import webhooksHandler from "./src/server/controllers/webhooks";
import authRouter from "./src/server/routers/auth";
import authHandler from "./src/server/controllers/auth";
import gmailHandler from "./src/server/controllers/gmail";
import candidatesHandler from "./src/server/controllers/candidates";
import aiHandler from "./src/server/controllers/ai";
import agentsHandler from "./src/server/controllers/agents";
import firebaseTokenHandler from "./src/server/controllers/firebase-token";
import dbHandler from "./src/server/controllers/db";
import { setupAgentRuntime } from "./src/server/controllers/setupRuntime";

const app = express();
const PORT = 3000;

// Use JSON parser for webhook bodies
app.use(express.json());

// Use API Gateway Auth
app.use("/api", requireAuth);

// New REST endpoints
app.use("/api/vendors", vendorsRouter);

// 1. Health check
app.use("/api/health", healthRouter);

// 2. Webhooks
app.all("/api/webhooks", async (req, res) => {
  try {
    await webhooksHandler(req as any, res as any);
  } catch (error) {
    console.error("[Webhooks Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. Auth Gateway
app.use("/api/auth", authRouter);

// 4. Gmail Gateway
app.all("/api/gmail", async (req, res) => {
  try {
    await gmailHandler(req as any, res as any);
  } catch (error) {
    console.error("[Gmail Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Candidates Gateway
app.all("/api/candidates", async (req, res) => {
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.error("[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 6. AI Gateway
app.all("/api/ai", async (req, res) => {
  try {
    await aiHandler(req as any, res as any);
  } catch (error) {
    console.error("[AI Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 7. Agents Gateway
app.all("/api/agents", async (req, res) => {
  try {
    await agentsHandler(req as any, res as any);
  } catch (error) {
    console.error("[Agents Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 8. Firebase Token Gateway
app.all("/api/firebase-token", async (req, res) => {
  try {
    await firebaseTokenHandler(req as any, res as any);
  } catch (error) {
    console.error("[Firebase Token Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 9. DB Proxy Gateway
app.all("/api/db", async (req, res) => {
  try {
    await dbHandler(req as any, res as any);
  } catch (error) {
    console.error("[DB Proxy Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Setup the internal Agent Runtime (Listens to system_events)
try {
  setupAgentRuntime();
} catch (error) {
  console.error("[AgentRuntime] Failed to execute setupAgentRuntime", error);
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // If running directly in Node, start the listener. If running via Vercel, app.listen shouldn't be invoked directly.
  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
