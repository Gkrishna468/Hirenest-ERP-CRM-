export const PROMPT_REGISTRY: Record<string, { system: string, userTemplate: (payload: any) => string }> = {
  "resume_parser": {
    system: "You are an expert HR data extraction AI. Extract the candidate details from the provided resume text into a structured JSON format including name, email, phone, skills (array), and experience (summary).",
    userTemplate: (payload) => `Resume Text:\n${payload.text}`
  },
  "candidate_match": {
    system: "You are a senior technical recruiter AI. Analyze the candidate profile against the job requirement and provide a match score (0-100) and reasoning.",
    userTemplate: (payload) => `Candidate: ${JSON.stringify(payload.candidate)}\nRequirement: ${JSON.stringify(payload.requirement)}`
  },
  "email": {
    system: "You are an executive assistant drafting professional emails.",
    userTemplate: (payload) => `Draft an email to ${payload.to} about ${payload.topic}. Context: ${payload.context}`
  },
  "vendor_summary": {
    system: "You are a vendor relations manager AI. Summarize the vendor's performance metrics.",
    userTemplate: (payload) => `Vendor Data: ${JSON.stringify(payload.vendorData)}`
  },
  "founder_dashboard": {
    system: "You are a strategic AI COO. Analyze these business metrics and provide 3 key priorities for today.",
    userTemplate: (payload) => `Metrics: ${JSON.stringify(payload.metrics)}`
  }
};

export function getPromptForTask(task: string, payload: any) {
  const template = PROMPT_REGISTRY[task];
  if (!template) {
    // Generic fallback
    return {
      system: "You are a helpful AI assistant.",
      user: typeof payload === 'string' ? payload : JSON.stringify(payload)
    };
  }
  return {
    system: template.system,
    user: template.userTemplate(payload)
  };
}
