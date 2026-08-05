import { Request, Response } from 'express';
import { smartTaskRouter } from '../ai/core/router.js';
import { policyEngine } from '../ai/core/policyEngine.js';
import { getPromptForTask } from '../ai/prompts/registry.js';
import { AIRequest } from '../ai/core/types.js';

export const aiGatewayHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { task, payload, priority, latency, reasoning, metadata, responseFormatJson } = req.body;
    
    if (!task) {
      res.status(400).json({ error: "Missing 'task' in request body." });
      return;
    }

    const aiRequest: AIRequest = {
      task,
      payload,
      priority,
      latency,
      reasoning,
      metadata
    };

    // 1. Resolve Prompts from Prompt Registry
    const { system, user } = getPromptForTask(task, payload);

    // 2. Apply Pre-Flight Policies (e.g. PII Masking)
    const sanitizedUser = policyEngine.applyPreFlightPolicies(user);

    // 3. Smart Task Router executes across providers
    const options = { responseFormatJson, model: req.body.model };
    const response = await smartTaskRouter.execute(aiRequest, system, sanitizedUser, options);

    // 4. Apply Post-Flight Policies (e.g. JSON Validation)
    const finalResult = policyEngine.applyPostFlightPolicies(response.result, responseFormatJson);

    res.status(200).json({
      success: true,
      data: finalResult,
      meta: {
        provider: response.provider,
        model: response.model,
        tokens: response.tokens,
        latencyMs: response.latencyMs,
        cost: response.cost
      }
    });
    return;
  } catch (error: any) {
    console.error("[AI Mesh Gateway] Error:", error.message);
    res.status(500).json({ error: error.message });
    return;
  }
};
