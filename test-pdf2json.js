import PDFParser from "pdf2json";
const pdfParser = new PDFParser(this, 1); // 1 = text only

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    console.log(pdfParser.getRawTextContent());
});

pdfParser.parseBuffer(Buffer.from("dummy"));
