const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('John Doe\nSoftware Engineer\nSkills: React, Node.js, TypeScript', {
    x: 50,
    y: height - 100,
    size: 24,
    font: font,
    color: rgb(0, 0, 0),
  });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('real.pdf', pdfBytes);
}

createPdf();
