import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# Remove dbProxy
content = content.replace('import { dbProxy } from "@/services/firebase/db-proxy";', "")

# Add apiFetch definition at the top if it doesn't exist, but Dashboard uses useAuth!
# useAuth returns apiFetch
content = content.replace("const { user } = useAuth();", "const { user, apiFetch } = useAuth();")

# Replace dbProxy calls
content = content.replace('const telData = await dbProxy.getDoc("ingestion_telemetry", "overall");', 
'const telData = await (await apiFetch("/api/system/ingestion_telemetry")).json();')

pattern = r'const queueItems = await dbProxy\.getDocs\("ai_reprocessing_queue", \{.*?\n\s+\}\);'
replacement = r'const queueItems = await (await apiFetch("/api/system/ai_reprocessing_queue")).json();'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
