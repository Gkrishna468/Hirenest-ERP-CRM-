const fs = require('fs');

async function run() {
  const FormData = (await import('formdata-node')).FormData;
  const { File } = await import('formdata-node');
  const fetch = (await import('node-fetch')).default;
  
  const fd = new FormData();
  fd.append("vendorId", "test-vendor");
  fd.append("requirementId", "test-req");
  fd.append("isPool", "true");
  fd.append("resume", new File(["dummy pdf content"], "dummy.pdf", { type: "application/pdf" }));

  try {
    const res = await fetch("http://localhost:3000/api/candidates/ingest", {
      method: "POST",
      body: fd
    });
    console.log("Response status:", res.status);
    console.log("Response text:", await res.text());
  } catch (e) {
    console.error("Fetch error:", e);
  }
}
run();
