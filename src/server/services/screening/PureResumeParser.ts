import { LinkedInVerification } from "./LinkedInVerification.js";

export interface ParsedProject {
  title: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  role?: string;
  description: string;
  technologies: string[];
}

export interface ParsedEmployment {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
  technologies: string[];
}

export interface ParsedResumeSections {
  summary: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  certifications: string;
  other: string;
}

export interface DeterministicParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  totalExperienceMonths: number;
  noticePeriod: string;
  currentCTC: string;
  expectedCTC: string;
  linkedinUrl?: string;
  skills: string[];
  primarySkills: string[];
  categorizedSkills: {
    languages: string[];
    frameworks: string[];
    cloud: string[];
    databases: string[];
    aiml: string[];
    genai: string[];
    llm: string[];
    rag: string[];
    agenticAi: string[];
    automation: string[];
  };
  projects: ParsedProject[];
  employmentHistory: ParsedEmployment[];
  education: string[];
  certifications: string[];
  sections: ParsedResumeSections;
}

const COMMON_TECH_TAXONOMY = {
  languages: ["python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "ruby", "rust", "scala", "kotlin", "php", "sql"],
  frameworks: ["django", "fastapi", "flask", "react", "next.js", "nextjs", "node.js", "nodejs", "express", "angular", "vue", "spring", "spring boot", ".net", "dotnet"],
  cloud: ["aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "github actions", "jenkins"],
  databases: ["postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "pinecone", "qdrant", "chromadb", "weaviate", "faiss", "milvus", "neo4j", "cassandra"],
  aiml: ["machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow", "scikit-learn", "numpy", "pandas", "hugging face", "transformers"],
  genai: ["genai", "generative ai", "prompt engineering", "fine-tuning", "lora", "diffusion"],
  llm: ["llm", "large language model", "gpt-4", "gpt-3.5", "claude", "gemini", "llama", "mistral", "bedrock", "vertex ai", "azure openai", "openai api"],
  rag: ["rag", "retrieval augmented generation", "vector search", "embeddings", "semantic search", "reranking", "hybrid search"],
  agenticAi: ["agentic ai", "ai agents", "autonomous agents", "langchain", "langgraph", "crewai", "autogen", "semantic kernel", "function calling", "tool use", "mcp"],
  automation: ["selenium", "playwright", "puppeteer", "airflow", "celery", "prefect", "n8n"]
};

export class PureResumeParser {
  /**
   * Deterministically splits resume into standard sections
   */
  static splitSections(text: string): ParsedResumeSections {
    const lines = text.split("\n");
    const sections: ParsedResumeSections = {
      summary: "",
      skills: "",
      experience: "",
      projects: "",
      education: "",
      certifications: "",
      other: ""
    };

    let currentSection: keyof ParsedResumeSections = "summary";
    const sectionHeaders: { pattern: RegExp; key: keyof ParsedResumeSections }[] = [
      { pattern: /^(summary|profile|about\s+me|professional\s+summary|objective)\b/i, key: "summary" },
      { pattern: /^(skills|technical\s+skills|core\s+competencies|technologies|skills\s+&\s+tools)\b/i, key: "skills" },
      { pattern: /^(experience|work\s+experience|employment\s+history|professional\s+experience)\b/i, key: "experience" },
      { pattern: /^(projects|key\s+projects|project\s+experience|portfolio)\b/i, key: "projects" },
      { pattern: /^(education|academic\s+background|academics|qualifications)\b/i, key: "education" },
      { pattern: /^(certifications|licenses|certificates|credentials)\b/i, key: "certifications" }
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let matchedHeader = false;
      // Check if line looks like a header (short, uppercase or title case)
      if (trimmed.length < 40) {
        for (const { pattern, key } of sectionHeaders) {
          if (pattern.test(trimmed.toLowerCase())) {
            currentSection = key;
            matchedHeader = true;
            break;
          }
        }
      }

      if (!matchedHeader) {
        sections[currentSection] += (sections[currentSection] ? "\n" : "") + trimmed;
      }
    }

    return sections;
  }

  /**
   * Deterministic extraction of identity and structured entities
   */
  static parse(text: string, fileName: string = ""): DeterministicParsedResume {
    const sections = this.splitSections(text);

    // 1. Email extraction
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    const email = emailMatch ? emailMatch[1].toLowerCase().trim() : "";

    // 2. Phone extraction (Indian and International standard regex)
    const phoneMatch = text.match(/(?:(?:\+91|0)?[ -]?)?([6-9]\d{9}|(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    // 3. LinkedIn URL
    const linkedinUrl = LinkedInVerification.extractLinkedInUrl(text);

    // 4. Candidate Name
    let name = "";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    // Usually the name is on the top 1-3 lines before email/phone
    for (const line of lines.slice(0, 5)) {
      if (
        !line.includes("@") &&
        !line.match(/\d{5,}/) &&
        !line.toLowerCase().includes("curriculum") &&
        !line.toLowerCase().includes("resume") &&
        !line.toLowerCase().includes("page") &&
        line.split(" ").length >= 2 &&
        line.split(" ").length <= 4 &&
        /^[a-zA-Z.\s]+$/.test(line)
      ) {
        name = line;
        break;
      }
    }
    if (!name && fileName) {
      // Clean file name
      name = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
    }
    if (!name) name = "Candidate Profile";

    // 5. Skills extraction using taxonomy matching
    const foundSkillsSet = new Set<string>();
    const categorized = {
      languages: [] as string[],
      frameworks: [] as string[],
      cloud: [] as string[],
      databases: [] as string[],
      aiml: [] as string[],
      genai: [] as string[],
      llm: [] as string[],
      rag: [] as string[],
      agenticAi: [] as string[],
      automation: [] as string[]
    };

    const lowerFullText = text.toLowerCase();

    for (const [cat, techList] of Object.entries(COMMON_TECH_TAXONOMY)) {
      for (const tech of techList) {
        const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
        if (regex.test(lowerFullText)) {
          const capTech = tech.toUpperCase() === "AWS" || tech.toUpperCase() === "GCP" || tech.toUpperCase() === "SQL" || tech.toUpperCase() === "LLM" || tech.toUpperCase() === "RAG"
            ? tech.toUpperCase()
            : tech.charAt(0).toUpperCase() + tech.slice(1);
          foundSkillsSet.add(capTech);
          (categorized as any)[cat].push(capTech);
        }
      }
    }

    const skills = Array.from(foundSkillsSet);
    const primarySkills = skills.slice(0, 6);

    // 6. Notice Period & CTC
    let noticePeriod = "30 Days";
    if (/immediate\s+joiner|immediately|0\s*days|available\s+immediately/i.test(text)) {
      noticePeriod = "Immediate";
    } else if (/15\s*days/i.test(text)) {
      noticePeriod = "15 Days";
    } else if (/60\s*days|2\s*months/i.test(text)) {
      noticePeriod = "60 Days";
    } else if (/90\s*days|3\s*months/i.test(text)) {
      noticePeriod = "90 Days";
    }

    let currentCTC = "";
    const ctcMatch = text.match(/(?:current\s*ctc|ctc|salary)\s*[:=-]?\s*([₹$€£\d.,\s]+(?:lpa|lac|lakh|k|per\s+annum)?)/i);
    if (ctcMatch) {
      currentCTC = ctcMatch[1].trim();
    }

    // 7. Extract Employment & Projects
    const employmentHistory = this.extractEmploymentHistory(sections.experience || text);
    const projects = this.extractProjects(sections.projects || text);

    // 8. Experience calculation
    const totalExperienceMonths = this.calculateTotalExperienceFromDates(text);

    // 9. Current title & company
    let currentTitle = "Software Engineer";
    let currentCompany = "";
    if (employmentHistory.length > 0) {
      currentTitle = employmentHistory[0].role || currentTitle;
      currentCompany = employmentHistory[0].company || currentCompany;
    }

    // 10. Education & Certifications
    const education = (sections.education || "").split("\n").filter(l => l.trim().length > 5).slice(0, 4);
    const certifications = (sections.certifications || "").split("\n").filter(l => l.trim().length > 5).slice(0, 5);

    return {
      name,
      email,
      phone,
      location: "India / Remote",
      currentTitle,
      currentCompany,
      totalExperienceMonths,
      noticePeriod,
      currentCTC,
      expectedCTC: "",
      linkedinUrl,
      skills,
      primarySkills,
      categorizedSkills: categorized,
      projects,
      employmentHistory,
      education,
      certifications,
      sections
    };
  }

  private static extractEmploymentHistory(expText: string): ParsedEmployment[] {
    const list: ParsedEmployment[] = [];
    const dateRangeRegex = /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(20\d{2}|present|current|till\s+date)/gi;

    const lines = expText.split("\n");
    let current: Partial<ParsedEmployment> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      dateRangeRegex.lastIndex = 0;
      const match = dateRangeRegex.exec(trimmed);

      if (match) {
        if (current && current.company) {
          list.push(current as ParsedEmployment);
        }
        const isCurrent = /present|current|till/i.test(match[4] || "");
        current = {
          company: trimmed.replace(dateRangeRegex, "").replace(/[|•-]/g, " ").trim() || "Company",
          role: "Developer",
          startDate: match[2],
          endDate: isCurrent ? "Present" : match[4],
          isCurrent,
          description: "",
          technologies: []
        };
      } else if (current) {
        current.description = (current.description || "") + " " + trimmed;
      }
    }

    if (current && current.company) {
      list.push(current as ParsedEmployment);
    }

    return list.slice(0, 8);
  }

  private static extractProjects(projText: string): ParsedProject[] {
    const list: ParsedProject[] = [];
    const blocks = projText.split(/(?:project\s*[:#\d]|title\s*:)/i);

    for (const block of blocks) {
      const trimmed = block.trim();
      if (trimmed.length < 20) continue;
      const lines = trimmed.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const title = lines[0] || "Client Project";
      const description = lines.slice(1).join(" ");
      list.push({
        title: title.length > 80 ? title.substring(0, 80) + "..." : title,
        description,
        technologies: []
      });
    }

    return list.slice(0, 6);
  }

  private static calculateTotalExperienceFromDates(text: string): number {
    const yearMatches = Array.from(text.matchAll(/\b(20\d{2}|19\d{2})\b/g)).map(m => parseInt(m[1], 10));
    if (yearMatches.length >= 2) {
      const currentYear = new Date().getFullYear();
      const validYears = yearMatches.filter(y => y >= 1995 && y <= currentYear);
      if (validYears.length >= 2) {
        const minYear = Math.min(...validYears);
        const maxYear = Math.max(...validYears);
        const diffYears = maxYear - minYear;
        if (diffYears > 0 && diffYears < 40) {
          return diffYears * 12;
        }
      }
    }
    // Check explicit mentions like "8+ years of experience"
    const expMention = text.match(/(\d{1,2})\+?\s*years?(?:\s+of)?\s+experience/i);
    if (expMention) {
      return parseInt(expMention[1], 10) * 12;
    }
    return 36; // Default to 3 years if unparseable
  }
}
