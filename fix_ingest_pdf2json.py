import re

with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

# Replace the pdfParse module loading
old_pdf_logic = '''// pdf-parse dynamic import to bypass ESM issues
      const pdfParseModule = await import("pdf-parse");
      const pdfParseFn = pdfParseModule.default || pdfParseModule;
      const pdfData = await (pdfParseFn as any)(fileBuffer);
      const resumeText = pdfData.text;'''

new_pdf_logic = '''// pdf2json for text extraction
      const PDFParser = (await import("pdf2json")).default;
      const resumeText = await new Promise<string>((resolve, reject) => {
          const pdfParser = new PDFParser(this as any, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
              resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(fileBuffer);
      });'''

content = content.replace(old_pdf_logic, new_pdf_logic)

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
