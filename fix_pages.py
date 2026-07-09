import re

with open('src/pages/MigrationDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", "")
content = content.replace("const { user } = useAuth();", "const { user, apiFetch } = useAuth();")
pattern = r'const recentMetrics = await dbProxy\.getDocs\(\'migration_metrics\', \{.*?\n\s+\}\);'
replacement = r'const recentMetrics = await (await apiFetch("/api/system/migration_metrics")).json();'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/pages/MigrationDashboard.tsx', 'w') as f:
    f.write(content)

with open('src/pages/Vendors.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", "")
content = content.replace("await dbProxy.setDoc('organizations', vendorId, {", "await apiFetch('/api/clients', { method: 'POST', body: JSON.stringify({ id: vendorId,")
content = content.replace("await dbProxy.addDoc('ingestion_executions', {", "await apiFetch('/api/system/ingestion_executions', { method: 'POST', body: JSON.stringify({")

# Wait, the closing braces for setDoc and addDoc need to be closed properly for apiFetch POST body.
# Let's fix them with regex if needed.
