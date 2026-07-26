export interface SkillContext {
  organizationId: string;
  actorId: string;
  memory: any;
}

export interface AISkill<TInput, TOutput> {
  name: string;
  description: string;
  execute(input: TInput, context: SkillContext): Promise<TOutput>;
}

// Example skill definition
export class ExtractSkillsSkill implements AISkill<string, string[]> {
  name = 'ExtractSkills';
  description = 'Extracts technical and soft skills from a body of text';
  
  async execute(input: string, context: SkillContext): Promise<string[]> {
    console.log(`[Skill: ${this.name}] Executing extraction...`);
    return ['React', 'TypeScript', 'Node.js'];
  }
}
