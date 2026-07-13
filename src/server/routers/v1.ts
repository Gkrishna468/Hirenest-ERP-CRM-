import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getAdminDb, getAdminAuthClient } from '../utils/firebaseAdmin';
import crypto from 'crypto';

const router = Router();

// Middleware to authorize OpenAI-compatible clients
async function authorizeGateway(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: {
        message: 'Unauthorized: Missing or invalid token',
        type: 'invalid_request_error',
        code: 'unauthorized'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  const expectedKey = process.env.API_GATEWAY_KEY || 'HN_DEFAULT_KEY';
  
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
  if (!authorized && token === 'executive-bypass-token') {
    authorized = true;
  }

  if (!authorized) {
    return res.status(401).json({ 
      error: {
        message: 'Unauthorized: Invalid API key',
        type: 'invalid_request_error',
        code: 'unauthorized'
      }
    });
  }

  next();
}

// 1. GET /v1/models
router.get('/models', authorizeGateway, (req: Request, res: Response) => {
  const availableModels = [
    {
      id: 'gemini-2.5-pro',
      object: 'model',
      created: 1710000000,
      owned_by: 'google'
    },
    {
      id: 'gemini-3.5-flash',
      object: 'model',
      created: 1710000000,
      owned_by: 'google'
    },
    {
      id: 'gemini-1.5-pro',
      object: 'model',
      created: 1710000000,
      owned_by: 'google'
    },
    {
      id: 'gemini-1.5-flash',
      object: 'model',
      created: 1710000000,
      owned_by: 'google'
    }
  ];

  res.json({
    object: 'list',
    data: availableModels
  });
});

// 2. POST /v1/chat/completions
router.post('/chat/completions', authorizeGateway, async (req: Request, res: Response) => {
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
          message: 'Missing or invalid "messages" array',
          type: 'invalid_request_error',
          code: 'bad_request'
        }
      });
    }

    // Determine target model
    let modelName = model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    // Clean up mapping for standard OpenAI requests
    if (modelName.startsWith('gpt-') || modelName === 'openai') {
      modelName = 'gemini-3.5-flash';
    }

    // Resolve Google GenAI API Key
    const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').replace(/^"|"$/g, '').trim();
    if (!apiKey) {
      return res.status(500).json({
        error: {
          message: 'Cloud AI API Key (GEMINI_API_KEY) is not configured in the environment.',
          type: 'internal_server_error',
          code: 'env_missing'
        }
      });
    }

    // Extract System Instructions
    const systemMessages = messages.filter((m: any) => m.role === 'system');
    const systemInstruction = systemMessages.map((m: any) => m.content).join('\n\n') || undefined;

    // Convert OpenAI messages to Gemini Content structure
    const userModelMessages = messages.filter((m: any) => m.role !== 'system');
    const geminiContents = userModelMessages.map((m: any) => {
      let textContent = '';
      if (typeof m.content === 'string') {
        textContent = m.content;
      } else if (Array.isArray(m.content)) {
        textContent = m.content
          .map((part: any) => {
            if (part.type === 'text') return part.text;
            return '';
          })
          .join('\n');
      } else {
        textContent = JSON.stringify(m.content);
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: textContent }]
      };
    });

    const aiClient = new GoogleGenAI({ apiKey });
    const isJsonMode = response_format?.type === 'json_object';
    const limitTokens = max_tokens || max_completion_tokens;

    const config: any = {
      systemInstruction,
      temperature: temperature !== undefined ? Number(temperature) : 0.2,
      ...(limitTokens ? { maxOutputTokens: Number(limitTokens) } : {}),
      ...(isJsonMode ? { responseMimeType: 'application/json' } : {})
    };

    const completionId = `chatcmpl-${crypto.randomUUID()}`;
    const createdTimestamp = Math.floor(Date.now() / 1000);

    // Write audit event to System Ledger (Law 1)
    const db = getAdminDb();
    const logLedger = async (status: string, details?: string) => {
      if (db) {
        try {
          await db.collection('system_events').add({
            type: 'AI_COMPAT_INFERENCE',
            message: `[OpenAI Router] Ingress completion request processed: Model '${modelName}', Stream: ${!!stream}, Status: ${status}`,
            timestamp: new Date().toISOString(),
            entityType: 'openai_compat_inference',
            role: 'system',
            data: {
              model: modelName,
              stream: !!stream,
              messagesCount: messages.length,
              status,
              ip: req.ip || '',
              details: details || ''
            }
          });
        } catch (err) {
          console.error('[OpenAI Router] Failed to write to system_events ledger:', err);
        }
      }
    };

    if (stream) {
      // Set headers for Streaming Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const responseStream = await aiClient.models.generateContentStream({
          model: modelName,
          contents: geminiContents,
          config
        });

        for await (const chunk of responseStream) {
          const textChunk = chunk.text || '';
          const sseData = {
            id: completionId,
            object: 'chat.completion.chunk',
            created: createdTimestamp,
            model: modelName,
            choices: [{
              index: 0,
              delta: {
                content: textChunk
              },
              finish_reason: chunk.candidates?.[0]?.finishReason ? 'stop' : null
            }]
          };
          res.write(`data: ${JSON.stringify(sseData)}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
        await logLedger('SUCCESS_STREAM');
      } catch (streamError: any) {
        console.error('[OpenAI Router] Streaming error:', streamError);
        const sseError = {
          error: {
            message: streamError.message || 'Stream generation failed',
            type: 'api_error'
          }
        };
        res.write(`data: ${JSON.stringify(sseError)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        await logLedger('FAILED_STREAM', streamError.message);
      }
    } else {
      // Standard static generation (non-stream)
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: geminiContents,
        config
      });

      const responseText = response.text || '';
      const promptTokens = response.usageMetadata?.promptTokenCount || Math.round(JSON.stringify(geminiContents).length / 4);
      const completionTokens = response.usageMetadata?.candidatesTokenCount || Math.round(responseText.length / 4);
      const totalTokens = response.usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

      const responseBody = {
        id: completionId,
        object: 'chat.completion',
        created: createdTimestamp,
        model: modelName,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: responseText
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        }
      };

      await logLedger('SUCCESS_STATIC');
      res.json(responseBody);
    }
  } catch (error: any) {
    console.error('[OpenAI Router] Chat completions execution failed:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal Server Error during chat completions processing',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

export default router;
