const fs = require('fs');

async function run() {
  try {
    const PDFParser = (await import("pdf2json")).default;
    console.log("PDFParser imported:", typeof PDFParser);
    const pdfParser = new PDFParser(this, 1);
    console.log("PDFParser initialized:", typeof pdfParser.parseBuffer);
    
    // Test with dummy buffer
    const dummyBuffer = Buffer.from("dummy data");
    pdfParser.on("pdfParser_dataError", (errData) => console.log("Error:", errData));
    pdfParser.on("pdfParser_dataReady", () => console.log("Ready"));
    pdfParser.parseBuffer(dummyBuffer);
  } catch (e) {
    console.error("Crash:", e);
  }
}
run();
