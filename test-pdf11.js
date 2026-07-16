async function run() {
  const mod = await import('pdf-parse');
  console.log(mod.default);
}
run();
