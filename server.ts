import { requirementsRouter } from "./src/server/routers/requirements";
import { clientsRouter } from "./src/server/routers/clients";
import { submissionsRouter } from "./src/server/routers/submissions";
import express from "express";
import path from "path";
// import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { requireAuth } from "./src/server/controllers/authMiddleware";
import healthRouter from "./src/server/routers/health";
import vendorsRouter from "./src/server/routers/vendors";
import dealsRouter from "./src/server/routers/deals";
import usersRouter from "./src/server/routers/users";
import contactsRouter from "./src/server/routers/contacts";
import systemEventsRouter from "./src/server/routers/system_events";
import systemRouter from "./src/server/routers/system";
import healthHandler from "./src/server/controllers/health";
import webhooksHandler from "./src/server/controllers/webhooks";
import authRouter from "./src/server/routers/auth";
import authHandler from "./src/server/controllers/auth";
import gmailRouter from "./src/server/routers/gmail";
import candidatesRouter from "./src/server/routers/candidates";
import candidatesHandler from "./src/server/controllers/candidates";
import aiRouter from "./src/server/routers/ai";
import openAIRouter from "./src/api-lib/handlers/openai";
import agentsHandler from "./src/server/controllers/agents";
import firebaseTokenHandler from "./src/server/controllers/firebase-token";
import { setupAgentRuntime } from "./src/server/controllers/setupRuntime";

const app = express();
const PORT = 3000;

// Use JSON parser for webhook bodies
app.use(express.json());

// Global CORS Middleware (Handles Preflight OPTIONS requests for Sandboxed/Null origins)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// OpenAI compatibility endpoints (Goose, VS Code Extensions, etc.)
app.use("/v1", openAIRouter);
app.use("/api/v1", openAIRouter);

// Use API Gateway Auth
app.use("/api", requireAuth);

// New REST endpoints
app.use("/api/vendors", vendorsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/users", usersRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/system_events", systemEventsRouter);
app.use("/api/system", systemRouter);

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
    app.use("/api/ai", aiRouter);
    app.use("/api/gmail", gmailRouter);

// 4. Gmail Gateway

// 5. Candidates Gateway
app.use("/api/candidates", candidatesRouter);
    app.use("/api/requirements", requirementsRouter);
    app.use("/api/clients", clientsRouter);
    app.use("/api/submissions", submissionsRouter);

// 6. AI Gateway

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


// Setup the internal Agent Runtime (Listens to system_events)
try {
  setupAgentRuntime();
} catch (error) {
  console.error("[AgentRuntime] Failed to execute setupAgentRuntime", error);
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
