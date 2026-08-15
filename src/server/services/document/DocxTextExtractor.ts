import { ResumeTextNormalizer } from "./ResumeTextNormalizer.js";

export class DocxTextExtractor {
  static async extractText(buffer: Buffer): Promise<{ text: string }> {
    let extractedText = "";

    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } catch (error) {
      console.warn("[DocxTextExtractor] Mammoth extraction failed:", error);
      extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }

    return {
      text: ResumeTextNormalizer.normalize(extractedText)
    };
  }
}
