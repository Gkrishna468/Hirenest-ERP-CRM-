import { ResumeTextNormalizer } from "./ResumeTextNormalizer.js";

export class PdfTextExtractor {
  static async extractText(buffer: Buffer): Promise<{ text: string; pageCount: number; isLikelyScanned: boolean }> {
    let extractedText = "";
    let pageCount = 1;

    try {
      const pdfParseMod = await import("pdf-parse");
      const PDFParse = (pdfParseMod as any).PDFParse || (pdfParseMod as any).default || pdfParseMod;
      
      if (typeof PDFParse === "function") {
        const data = await PDFParse(buffer);
        extractedText = data.text || "";
        pageCount = data.numpages || 1;
      } else {
        // Fallback for object with default
        const data = await (pdfParseMod as any)(buffer);
        extractedText = data?.text || "";
        pageCount = data?.numpages || 1;
      }
    } catch (error) {
      console.warn("[PdfTextExtractor] PDF parse failed, checking raw buffer:", error);
    }

    const normalized = ResumeTextNormalizer.normalize(extractedText);
    const charCount = normalized.replace(/\s/g, "").length;
    // If fewer than 50 alphanumeric characters across multiple pages, it's likely scanned or image-based
    const isLikelyScanned = charCount < 60;

    return {
      text: normalized,
      pageCount,
      isLikelyScanned
    };
  }
}
