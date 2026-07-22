import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { getAdminDb, getAdminAuthClient } from "../../server/utils/firebaseAdmin";
import { executeServerAITask } from "../../server/controllers/aiGateway";
import crypto from "crypto";

const router = Router();

// Middleware to authorize OpenAI-compatible clients
async function authorizeGateway(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        message: "Unauthorized: Missing or invalid token",
        type: "invalid_request_error",
        code: "unauthorized"
      }
    });
  }

  const token = authHeader.split(" ")[1];
  
  // Accept HIRENEST_API_KEY, API_GATEWAY_KEY, or HN_DEFAULT_KEY
  const expectedKey = process.env.HIRENEST_API_KEY || process.env.API_GATEWAY_KEY || "HN_DEFAULT_KEY";
  let authorized = (token === expectedKey);

  // Fallback to Firebase authentication if a valid firebase token is provided
  if (!authorized) {
    try {
      const authClient = getAdminAuthClient();
      if (authClient) {
        const decodedToken = await authClient.verifyIdToken(token);
        if (decodedToken) {
          authorized = true;
        }
      }
    } catch (e) {
      // Not a valid firebase token, proceed to check custom bypass keys
    }
  }

  // Fallback for developer bypass tokens
  if (!authorized && token === "executive-bypass-token") {
    authorized = true;
  }

  if (!authorized) {
    return res.status(401).json({
      error: {
        message: "Unauthorized: Invalid API key",
        type: "invalid_request_error",
        code: "unauthorized"
      }
    });
  }

  next();
}

// 1. GET /v1/models (Unauthenticated for discovery/tools support)
router.get("/models", (req: Request, res: Response) => {
  const availableModels = [
    {
      id: "gemini-2.5-pro",
      object: "model",
      created: 1710000000,
      owned_by: "google"
    },
    {
      id: "gemini-2.5-flash",
      object: "model",
      created: 1710000000,
      owned_by: "google"
    },
    {
      id: "gemini-2.5-flash",
      object: "model",
      created: 1710000000,
      owned_by: "google"
    },
    {
      id: "gemini-1.5-pro",
      object: "model",
      created: 1710000000,
      owned_by: "google"
    }
  ];

  res.json({
    object: "list",
    data: availableModels
  });
});

// 2. POST /v1/chat/completions
router.post("/chat/completions", authorizeGateway, async (req: Request, res: Response) => {
  try {
    const {
      model,
      messages,
      temperature,
      max_tokens,
      max_completion_tokens,
      response_format,
      stream
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: {
          message: "Missing or invalid 'messages' array",
          type: "invalid_request_error",
          code: "bad_request"
        }
      });
    }

    // Determine target model
    let modelName = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    if (modelName.startsWith("gpt-") || modelName === "openai") {
      modelName = "gemini-2.5-flash";
    }

    // Extract System Instructions
    const systemMessages = messages.filter((m: any) => m.role === "system");
    const systemInstruction = systemMessages.map((m: any) => m.content).join("\n\n") || undefined;

    // Convert other messages into standard format for execution / streaming
    const chatMessages = messages.filter((m: any) => m.role !== "system");
    const flatPrompt = chatMessages
      .map((m: any) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n\n");

    const completionId = `chatcmpl-${crypto.randomUUID()}`;
    const createdTimestamp = Math.floor(Date.now() / 1000);

    // Write audit event to the Immutable Ledger (Law 1)
    const db = getAdminDb();
    const logLedger = async (status: string, details?: string) => {
      if (db) {
        try {
          await db.collection("system_events").add({
            type: "AI_COMPAT_INFERENCE",
            message: `[OpenAI Compatibility] Request processed: Model '${modelName}', Stream: ${!!stream}, Status: ${status}`,
            timestamp: new Date().toISOString(),
            entityType: "openai_compat_inference",
            role: "system",
            data: {
              model: modelName,
              stream: !!stream,
              messagesCount: messages.length,
              status,
              ip: req.ip || "",
              details: details || ""
            }
          });
        } catch (err) {
          console.error("[OpenAI Router] Failed to write to system_events:", err);
        }
      }
    };

    // Streaming branch
    if (stream) {
      const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").replace(/^"|"$/g, "").trim();
      if (!apiKey) {
        return res.status(500).json({
          error: {
            message: "GEMINI_API_KEY is not configured for stream generation.",
            type: "internal_server_error",
            code: "env_missing"
          }
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const aiClient = new GoogleGenAI({ apiKey });
        const geminiContents = chatMessages.map((m: any) => {
          let textContent = "";
          if (typeof m.content === "string") {
            textContent = m.content;
          } else if (Array.isArray(m.content)) {
            textContent = m.content
              .map((p: any) => (p.type === "text" ? p.text : ""))
              .join("\n");
          } else {
            textContent = JSON.stringify(m.content);
          }

          return {
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: textContent }]
          };
        });

        const limitTokens = max_tokens || max_completion_tokens;
        const config: any = {
          systemInstruction,
          temperature: temperature !== undefined ? Number(temperature) : 0.2,
          ...(limitTokens ? { maxOutputTokens: Number(limitTokens) } : {}),
          ...(response_format?.type === "json_object" ? { responseMimeType: "application/json" } : {})
        };

        const responseStream = await aiClient.models.generateContentStream({
          model: modelName,
          contents: geminiContents,
          config
        });

        for await (const chunk of responseStream) {
          const textChunk = chunk.text || "";
          const sseData = {
            id: completionId,
            object: "chat.completion.chunk",
            created: createdTimestamp,
            model: modelName,
            choices: [{
              index: 0,
              delta: {
                content: textChunk
              },
              finish_reason: chunk.candidates?.[0]?.finishReason ? "stop" : null
            }]
          };
          res.write(`data: ${JSON.stringify(sseData)}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();
        await logLedger("SUCCESS_STREAM");
      } catch (streamError: any) {
        console.error("[OpenAI Router] Stream failed:", streamError);
        const sseError = {
          error: {
            message: streamError.message || "Streaming failed",
            type: "api_error"
          }
        };
        res.write(`data: ${JSON.stringify(sseError)}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        await logLedger("FAILED_STREAM", streamError.message);
      }
    } else {
      // Non-streaming (static) branch: REUSE existing executeServerAITask orchestrator
      try {
        const responseFormatJson = response_format?.type === "json_object";
        const priority = temperature !== undefined && temperature < 0.3 ? "high" : "low";

        const result = await executeServerAITask({
          action: "compat-chat",
          prompt: flatPrompt,
          systemInstruction,
          responseFormatJson,
          priority: priority as any,
          complexity: modelName.includes("pro") ? "complex" : "simple",
          metadata: {
            model: modelName,
            temperature,
            max_tokens: max_tokens || max_completion_tokens
          }
        });

        const promptTokens = Math.round(flatPrompt.length / 4);
        const completionTokens = Math.round(result.text.length / 4);
        const totalTokens = promptTokens + completionTokens;

        const responseBody = {
          id: completionId,
          object: "chat.completion",
          created: createdTimestamp,
          model: result.modelUsed || modelName,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: result.text
              },
              finish_reason: "stop"
            }
          ],
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens
          }
        };

        await logLedger("SUCCESS_STATIC");
        res.json(responseBody);
      } catch (gatewayError: any) {
        console.error("[OpenAI Router] Static generation with executeServerAITask failed, falling back to direct GenAI:", gatewayError);
        
        // Fallback to direct client if the orchestrator fails or is unconfigured
        const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").replace(/^"|"$/g, "").trim();
        if (!apiKey) {
          throw new Error("No GEMINI_API_KEY found to handle fallback completion.");
        }

        const aiClient = new GoogleGenAI({ apiKey });
        const geminiContents = chatMessages.map((m: any) => {
          let textContent = "";
          if (typeof m.content === "string") {
            textContent = m.content;
          } else if (Array.isArray(m.content)) {
            textContent = m.content
              .map((p: any) => (p.type === "text" ? p.text : ""))
              .join("\n");
          } else {
            textContent = JSON.stringify(m.content);
          }

          return {
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: textContent }]
          };
        });

        const limitTokens = max_tokens || max_completion_tokens;
        const config: any = {
          systemInstruction,
          temperature: temperature !== undefined ? Number(temperature) : 0.2,
          ...(limitTokens ? { maxOutputTokens: Number(limitTokens) } : {}),
          ...(response_format?.type === "json_object" ? { responseMimeType: "application/json" } : {})
        };

        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: geminiContents,
          config
        });

        const text = response.text || "";
        const responseBody = {
          id: completionId,
          object: "chat.completion",
          created: createdTimestamp,
          model: modelName,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: text
              },
              finish_reason: "stop"
            }
          ],
          usage: {
            prompt_tokens: response.usageMetadata?.promptTokenCount || Math.round(flatPrompt.length / 4),
            completion_tokens: response.usageMetadata?.candidatesTokenCount || Math.round(text.length / 4),
            total_tokens: response.usageMetadata?.totalTokenCount || (Math.round(flatPrompt.length / 4) + Math.round(text.length / 4))
          }
        };

        await logLedger("SUCCESS_STATIC_FALLBACK");
        res.json(responseBody);
      }
    }
  } catch (error: any) {
    console.error("[OpenAI Router] Execution failed:", error);
    res.status(500).json({
      error: {
        message: error.message || "Internal Server Error during completions processing",
        type: "api_error",
        code: "internal_error"
      }
    });
  }
});

export default router;
