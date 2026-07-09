import re

with open('src/server/controllers/aiGateway.ts', 'r') as f:
    content = f.read()

# Replace the export function getAdminDb()... definition with nothing
# since it's already imported from firebaseAdmin
content = re.sub(r'export function getAdminDb\(\): Firestore \| null \{.*?return db;\n\}\n', '', content, flags=re.DOTALL)

with open('src/server/controllers/aiGateway.ts', 'w') as f:
    f.write(content)
