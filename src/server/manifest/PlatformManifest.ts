export interface PlatformManifest {
  platform: {
    version: string;
    sdk: string;
  };
  modules: string[];
  agents: string[];
  skills: string[];
  providers: string[];
  models: Record<string, string>;
  policies: Record<string, string>;
}

export class ManifestService {
  private currentManifest: PlatformManifest = {
    platform: {
      version: '1.0.0',
      sdk: '1.0.0'
    },
    modules: ['crm', 'ats', 'outreach', 'recruiter', 'vendor'],
    agents: ['communication-agent', 'recruiter-agent'],
    skills: ['parse_resume', 'generate_email', 'extract_skills'],
    providers: ['gmail'],
    models: {
      planner: 'gpt-5.5',
      classifier: 'gemini-flash',
      embeddings: 'local'
    },
    policies: {
      approval: 'enabled',
      audit: 'enabled'
    }
  };

  getManifest(): PlatformManifest {
    return this.currentManifest;
  }
}

export const manifestService = new ManifestService();
