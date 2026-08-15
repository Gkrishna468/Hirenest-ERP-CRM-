export type LinkedInVerificationStatus = 
  | "NOT_CHECKED" 
  | "CHECKED" 
  | "MATCHED" 
  | "MISMATCH" 
  | "UNAVAILABLE";

export interface LinkedInVerificationData {
  linkedinUrl?: string;
  linkedinVerificationStatus: LinkedInVerificationStatus;
  linkedinCheckedAt?: string;
  linkedinCheckedBy?: string;
  linkedinMismatchFields: string[];
  notes?: string;
}

export interface ILinkedInVerificationProvider {
  verify(linkedinUrl: string): Promise<Partial<LinkedInVerificationData>>;
}

export class LinkedInVerification {
  /**
   * Extracts LinkedIn profile URL from text
   */
  static extractLinkedInUrl(text: string): string | undefined {
    const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    if (match) {
      return this.normalizeLinkedInUrl(match[0]);
    }
    return undefined;
  }

  /**
   * Normalizes LinkedIn profile URL
   */
  static normalizeLinkedInUrl(url: string): string {
    if (!url) return "";
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith("http")) {
      clean = `https://${clean}`;
    }
    // Remove query params
    clean = clean.split("?")[0].replace(/\/+$/, "");
    return clean;
  }

  /**
   * Validates LinkedIn URL format
   */
  static isValidLinkedInUrl(url?: string): boolean {
    if (!url) return false;
    const normalized = this.normalizeLinkedInUrl(url);
    return /^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i.test(normalized);
  }

  /**
   * Creates initial manual verification state
   */
  static createInitialState(url?: string): LinkedInVerificationData {
    const valid = this.isValidLinkedInUrl(url);
    return {
      linkedinUrl: valid ? this.normalizeLinkedInUrl(url!) : undefined,
      linkedinVerificationStatus: valid ? "NOT_CHECKED" : "UNAVAILABLE",
      linkedinMismatchFields: []
    };
  }
}
