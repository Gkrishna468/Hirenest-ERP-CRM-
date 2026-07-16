import { PDFParse } from 'pdf-parse';
const parser = new PDFParse({});
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
