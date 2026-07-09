import re

with open('src/pages/Vendors.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", "")

content = re.sub(
    r"await dbProxy\.setDoc\('organizations', vendorId, \{(.*?)\}\);",
    r"await apiFetch('/api/clients', { method: 'POST', body: JSON.stringify({ id: vendorId,\1}) });",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"await dbProxy\.addDoc\('ingestion_executions', \{(.*?)\}\);",
    r"await apiFetch('/api/system/ingestion_executions', { method: 'POST', body: JSON.stringify({\1}) });",
    content,
    flags=re.DOTALL
)

with open('src/pages/Vendors.tsx', 'w') as f:
    f.write(content)
