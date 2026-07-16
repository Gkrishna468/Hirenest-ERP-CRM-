import { PDFParse } from 'pdf-parse';
async function test() {
  const parser = new PDFParse({});
  // Wait, does it take a buffer?
  // let's try reading a fake PDF... or just check if it fails gracefully
  try {
     await parser.load(Buffer.from([]));
     const text = await parser.getText();
     console.log("TEXT:", text);
  } catch (e) { console.error(e) }
}
test();
