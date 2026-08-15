import { ResumeTextNormalizer } from "./ResumeTextNormalizer.js";

export interface OcrResult {
  ocrUsed: boolean;
  ocrConfidence: number;
  ocrPagesProcessed: number;
  ocrCharacterCount: number;
  ocrWarnings: string[];
  text: string;
}

export class OcrService {
  /**
   * Performs optical character recognition on image/scanned documents using open-source Tesseract
   */
  static async performOcr(buffer: Buffer): Promise<OcrResult> {
    const warnings: string[] = [];
    let text = "";
    let confidence = 0;

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      
      const ret = await worker.recognize(buffer);
      text = ret.data.text || "";
      confidence = ret.data.confidence || 0;
      await worker.terminate();

      if (confidence < 45) {
        warnings.push("Low OCR confidence score (< 45%). Manual document review recommended.");
      }
    } catch (error: any) {
      console.warn("[OcrService] OCR recognition error:", error);
      warnings.push(`OCR processing warning: ${error?.message || "Unknown error"}`);
    }

    const normalized = ResumeTextNormalizer.normalize(text);

    return {
      ocrUsed: true,
      ocrConfidence: Math.round(confidence),
      ocrPagesProcessed: 1,
      ocrCharacterCount: normalized.length,
      ocrWarnings: warnings,
      text: normalized
    };
  }
}
