async function run() {
  const fs = require('fs');
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  
  const data = new Uint8Array(fs.readFileSync('real.pdf'));
  const loadingTask = pdfjsLib.getDocument({data: data, standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'});
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  console.log(fullText);
}
run();
