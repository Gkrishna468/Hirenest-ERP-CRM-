export class PolicyEngine {
  
  applyPreFlightPolicies(prompt: string): string {
    // Basic PII Masking example
    let sanitized = prompt;
    // Mask emails
    sanitized = sanitized.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, "[EMAIL MASKED]");
    // Mask phone numbers (simple example)
    sanitized = sanitized.replace(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, "[PHONE MASKED]");
    return sanitized;
  }
  
  applyPostFlightPolicies(response: string, responseFormatJson?: boolean): any {
    if (responseFormatJson) {
      try {
        // Find JSON block if wrapped in markdown
        const match = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
        const jsonString = match ? match[1] : response;
        return JSON.parse(jsonString);
      } catch (e) {
        throw new Error("Policy Violation: Response was not valid JSON");
      }
    }
    return response;
  }
}

export const policyEngine = new PolicyEngine();
