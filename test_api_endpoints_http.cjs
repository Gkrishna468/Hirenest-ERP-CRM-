const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer executive-bypass-token'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawBody: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function run() {
  console.log("=== TESTING ALL HTTP ENDPOINTS ON PORT 3000 ===");
  const endpoints = [
    '/api/clients',
    '/api/requirements',
    '/api/candidates',
    '/api/vendors',
    '/api/deals',
    '/api/users/executive-root'
  ];

  for (const ep of endpoints) {
    try {
      const res = await makeRequest(ep);
      console.log(`Endpoint: ${ep} | Status: ${res.statusCode} | IsArray: ${Array.isArray(res.body)} | Count/Keys: ${Array.isArray(res.body) ? res.body.length : (res.body ? Object.keys(res.body).length : 'N/A')}`);
      if (res.statusCode !== 200) {
        console.log("  -> Failure response:", res.body || res.rawBody);
      }
    } catch (err) {
      console.error(`Endpoint ${ep} failed with network error:`, err);
    }
  }
}

run().catch(console.error);
