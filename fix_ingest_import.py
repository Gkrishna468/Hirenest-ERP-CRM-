with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()
content = content.replace('import pdfParse from "pdf-parse";\n', '')
content = content.replace('const pdfData = await pdfParse(fileBuffer);', '''// pdf-parse dynamic import to bypass ESM issues
      const pdfParseModule = await import("pdf-parse");
      const pdfParseFn = pdfParseModule.default || pdfParseModule;
      const pdfData = await (pdfParseFn as any)(fileBuffer);''')

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
