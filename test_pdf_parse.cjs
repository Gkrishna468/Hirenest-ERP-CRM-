async function run() {
  const pdfParse = (await import("pdf-parse")).default;
  console.log("pdfParse type:", typeof pdfParse);
  if (typeof pdfParse !== 'function') {
    console.log("pdfParse keys:", Object.keys(await import("pdf-parse")));
  }
}
run();
