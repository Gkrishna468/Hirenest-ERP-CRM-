import { PDFParse } from 'pdf-parse';
async function test() {
  const parser = new PDFParse({});
  try {
     await parser.load(new Uint8Array([]));
     const text = await parser.getText();
     console.log("TEXT:", text);
  } catch (e) { console.error(e) }
}
test();
