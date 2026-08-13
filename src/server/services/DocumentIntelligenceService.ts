import { executeServerAITask } from "../controllers/aiGateway.js";
import { createHash } from "crypto";

export interface ExtractedCandidateProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  currentCompany: string;
  currentTitle: string;
  totalExperience: string;
  relevantExperience: string;
  skills: string[];
  primarySkills: string[];
  education: string;
  certifications: string[];
  currentCTC: string;
  expectedCTC: string;
  noticePeriod: string;
  availability: string;
  domain: string;
  summary: string;
  resumeHash: string;
  candidateHash: string;
  parsedAt: string;
  parserVersion: string;
}

export class DocumentIntelligenceService {
  /**
   * Generates a SHA-256 hash for document buffer to detect duplicate files
   */
  static computeFileHash(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Generates a unique identity hash based on email or normalized phone + name
   */
  static computeIdentityHash(name: string, email?: string, phone?: string): string {
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const seed = cleanEmail || `${cleanName}:${cleanPhone}` || cleanName;
    return createHash("sha256").update(seed).digest("hex");
  }

  /**
   * Primary text extraction pipeline supporting PDF, DOC, and DOCX
   */
  static async extractRawText(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const isDocx = fileName.toLowerCase().endsWith(".docx") || mimeType?.includes("wordprocessingml");
    const isDoc = fileName.toLowerCase().endsWith(".doc") || mimeType?.includes("msword");
    const isPdf = fileName.toLowerCase().endsWith(".pdf") || mimeType?.includes("pdf");

    let rawText = "";

    if (isDocx || isDoc) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || "";
      } catch (err) {
        console.warn("[DocumentIntelligence] Mammoth extraction warning:", err);
        rawText = buffer.toString("utf-8");
      }
    } else if (isPdf) {
      try {
        const pdfParseMod = await import("pdf-parse");
        const PDFParse = (pdfParseMod as any).PDFParse || pdfParseMod;
        if (typeof PDFParse === "function") {
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          const result = await parser.getText();
          rawText = result.text || result;
        } else if (typeof (pdfParseMod as any).default === "function") {
          const res = await (pdfParseMod as any).default(buffer);
          rawText = res.text;
        } else {
          rawText = buffer.toString("utf-8");
        }
      } catch (err) {
        console.warn("[DocumentIntelligence] PDF Parse warning:", err);
        rawText = buffer.toString("utf-8");
      }
    } else {
      rawText = buffer.toString("utf-8");
    }

    // Clean and normalize extracted text
    return rawText
      .replace(/\0/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  /**
   * Main Document Intelligence Ingestion Pipeline
   */
  static async processResumeDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<ExtractedCandidateProfile> {
    const parsedAt = new Date().toISOString();
    const fileHash = this.computeFileHash(buffer);

    // Step 1: Raw Text Extraction
    const rawText = await this.extractRawText(buffer, fileName, mimeType);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Document text extraction produced empty result. Unsupported or corrupted file.");
    }

    // Step 2: AI Parsing Engine Execution
    const aiResult = await executeServerAITask({
      action: "resume-parser",
      prompt: `Extract structured candidate details from the following resume text:\n\n${rawText.substring(0, 15000)}`,
      responseFormatJson: true,
      priority: "high",
    });

    let jsonParsed: any = {};
    try {
      const cleanJsonStr = (aiResult.text || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      jsonParsed = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.warn("[DocumentIntelligence] AI JSON parse fallback triggered:", parseErr);
    }

    const name = (jsonParsed.name || fileName.replace(/\.[^/.]+$/, "") || "Unknown Candidate").trim();
    const email = (jsonParsed.email || "").trim().toLowerCase();
    const phone = (jsonParsed.phone || "").trim();
    const candidateHash = this.computeIdentityHash(name, email, phone);

    return {
      name,
      email,
      phone,
      location: jsonParsed.location || "Not Specified",
      currentCompany: jsonParsed.currentCompany || "Not Specified",
      currentTitle: jsonParsed.currentTitle || "Software Professional",
      totalExperience: jsonParsed.experience || jsonParsed.totalExperience || "0 Years",
      relevantExperience: jsonParsed.relevantExperience || jsonParsed.experience || "0 Years",
      skills: Array.isArray(jsonParsed.skills) ? jsonParsed.skills : [],
      primarySkills: Array.isArray(jsonParsed.skills) ? jsonParsed.skills.slice(0, 5) : [],
      education: jsonParsed.education || "",
      certifications: Array.isArray(jsonParsed.certifications) ? jsonParsed.certifications : [],
      currentCTC: jsonParsed.currentCTC || jsonParsed.currentSalary || "",
      expectedCTC: jsonParsed.expectedSalary || jsonParsed.expectedCTC || "",
      noticePeriod: jsonParsed.noticePeriod || "Immediate",
      availability: jsonParsed.noticePeriod === "Immediate" ? "Immediate" : "Standard Notice",
      domain: jsonParsed.domain || "IT / Software",
      summary: jsonParsed.summary || `Extracted candidate profile for ${name}`,
      resumeHash: fileHash,
      candidateHash,
      parsedAt,
      parserVersion: "v2.0.0-doc-intel",
    };
  }
}
