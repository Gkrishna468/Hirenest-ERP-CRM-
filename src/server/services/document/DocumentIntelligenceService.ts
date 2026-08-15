import { createHash } from "crypto";
import { PdfTextExtractor } from "./PdfTextExtractor.js";
import { DocxTextExtractor } from "./DocxTextExtractor.js";
import { OcrService, OcrResult } from "./OcrService.js";
import { ResumeTextNormalizer } from "./ResumeTextNormalizer.js";

export interface DocumentExtractionResult {
  rawText: string;
  normalizedText: string;
  fileHash: string;
  mimeType: string;
  fileName: string;
  ocrInfo: OcrResult;
  isScanned: boolean;
  extractionQuality: "HIGH" | "MEDIUM" | "LOW" | "DOCUMENT_QUALITY_REVIEW";
}

export class DocumentIntelligenceService {
  static computeFileHash(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }

  static computeIdentityHash(name: string, email?: string, phone?: string): string {
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const seed = cleanEmail || `${cleanName}:${cleanPhone}` || cleanName;
    return createHash("sha256").update(seed).digest("hex");
  }

  static async extractDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<DocumentExtractionResult> {
    const fileHash = this.computeFileHash(buffer);
    const isDocx = fileName.toLowerCase().endsWith(".docx") || mimeType?.includes("wordprocessingml");
    const isDoc = fileName.toLowerCase().endsWith(".doc") || mimeType?.includes("msword");
    const isPdf = fileName.toLowerCase().endsWith(".pdf") || mimeType?.includes("pdf");

    let rawText = "";
    let isScanned = false;
    let ocrInfo: OcrResult = {
      ocrUsed: false,
      ocrConfidence: 100,
      ocrPagesProcessed: 0,
      ocrCharacterCount: 0,
      ocrWarnings: [],
      text: ""
    };

    if (isDocx || isDoc) {
      const docxRes = await DocxTextExtractor.extractText(buffer);
      rawText = docxRes.text;
    } else if (isPdf) {
      const pdfRes = await PdfTextExtractor.extractText(buffer);
      rawText = pdfRes.text;
      isScanned = pdfRes.isLikelyScanned;

      // If PDF text is sparse/scanned, perform OCR
      if (isScanned || rawText.replace(/\s/g, "").length < 60) {
        ocrInfo = await OcrService.performOcr(buffer);
        if (ocrInfo.text.length > rawText.length) {
          rawText = ocrInfo.text;
        }
      }
    } else {
      rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }

    const normalizedText = ResumeTextNormalizer.normalize(rawText);
    const charCount = normalizedText.replace(/\s/g, "").length;

    let extractionQuality: "HIGH" | "MEDIUM" | "LOW" | "DOCUMENT_QUALITY_REVIEW" = "HIGH";
    if (charCount < 50) {
      extractionQuality = "DOCUMENT_QUALITY_REVIEW";
    } else if (charCount < 200 || (ocrInfo.ocrUsed && ocrInfo.ocrConfidence < 50)) {
      extractionQuality = "LOW";
    } else if (ocrInfo.ocrUsed && ocrInfo.ocrConfidence < 75) {
      extractionQuality = "MEDIUM";
    }

    return {
      rawText,
      normalizedText,
      fileHash,
      mimeType,
      fileName,
      ocrInfo,
      isScanned,
      extractionQuality
    };
  }
}
