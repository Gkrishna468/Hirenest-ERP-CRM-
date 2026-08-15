/**
 * Clean and normalize text extracted from resumes (PDF, DOCX, OCR)
 */
export class ResumeTextNormalizer {
  static normalize(raw: string): string {
    if (!raw) return "";
    return raw
      .replace(/\0/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  static cleanSectionHeading(heading: string): string {
    return heading.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }
}
