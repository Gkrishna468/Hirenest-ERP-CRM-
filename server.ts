import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Use JSON parser for webhook bodies
app.use(express.json());

// Main init function
async function init() {
  // Use API Gateway Auth
  const { requireAuth } = await import("./src/server/controllers/authMiddleware.ts");
  app.use("/api", requireAuth);

  // 1. Health check
  app.all("/api/health", async (req, res) => { 
    if (req.query.action || (req.body && req.body.action)) {
      try {
        const { default: handler } = await import("./src/server/controllers/health.ts");
        await handler(req as any, res as any);
      } catch (error) {
        console.error("[Health Error]", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.json({ status: "ok", service: "hirenest-backend" });
    }
  });

  // 2. Webhooks
  app.all("/api/webhooks", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/webhooks.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Webhooks Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 3. Auth Gateway
  app.all("/api/auth", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/auth.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Auth Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 4. Gmail Gateway
  app.all("/api/gmail", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/gmail.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Gmail Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 5. Candidates Gateway
  app.all("/api/candidates", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/candidates.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Candidates Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 6. AI Gateway
  app.all("/api/ai", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/ai.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[AI Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 7. Agents Gateway
  app.all("/api/agents", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/agents.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Agents Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 8. Firebase Token Gateway
  app.all("/api/firebase-token", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/firebase-token.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Firebase Token Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 9. DB Proxy Gateway
  app.all("/api/db", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/db.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[DB Proxy Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 10. Health Gateway
  app.all("/api/health/checks", async (req, res) => {
    try {
      const { default: handler } = await import("./src/server/controllers/health.ts");
      await handler(req as any, res as any);
    } catch (error) {
      console.error("[Health Error]", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Setup the internal Agent Runtime (Listens to system_events)
  try {
    const { setupAgentRuntime } = await import("./src/server/controllers/setupRuntime.ts");
    setupAgentRuntime();
  } catch (error) {
    console.error("[AgentRuntime] Failed to import/execute setupAgentRuntime", error);
  }

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
}

// Call init, and only start listening if we are not imported as a module (e.g. Vercel)
init().then(() => {
  // If running directly in Node, start the listener. If running via Vercel, app.listen shouldn't be invoked directly, but since process.env.VERCEL is true, we could skip it.
  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
});

export default app;
