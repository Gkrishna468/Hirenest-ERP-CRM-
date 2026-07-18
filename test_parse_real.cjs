async function run() {
  const fs = require('fs');
  const buffer = fs.readFileSync('real.pdf');
  try {
      const pdfParseMod = await import("pdf-parse");
      const PDFParse = pdfParseMod.PDFParse;
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      console.log("Success text length:", result.text.length || result.length);
  } catch (err) {
      console.log("Error inside pdfParse:", err.name, err.message, err);
  }
}
run();
