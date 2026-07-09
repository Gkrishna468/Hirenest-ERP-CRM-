import re

with open('src/contexts/DataContext.tsx', 'r') as f:
    content = f.read()

# Remove dbProxy import
content = content.replace('import { dbProxy } from "@/services/firebase/db-proxy";', "")

# Replace dbProxy.setDoc calls for agent_logs
content = re.sub(
    r"await dbProxy\.setDoc\(\"agent_logs\", logId, \{(.*?)\}\);",
    r"await apiFetch('/api/system_events', { method: 'POST', body: JSON.stringify({ id: logId, \1}) });",
    content,
    flags=re.DOTALL
)

# Replace dbProxy.setDoc calls for system_events
content = re.sub(
    r"await dbProxy\.setDoc\(\"system_events\", crypto\.randomUUID\(\), \{(.*?)\}\);",
    r"await apiFetch('/api/system_events', { method: 'POST', body: JSON.stringify({ id: crypto.randomUUID(), \1}) });",
    content,
    flags=re.DOTALL
)

# Add apiFetch definition inside refreshAll or globally if needed, wait, DataContext CANNOT use apiFetch directly because it's not defined!
# AuthContext provides useAuth which might have apiFetch.
# Wait, DataContext already has `const { user } = useAuth();`
# But does it have `apiFetch`?
# In AuthContext:
# export const useAuth = () => {
#   return { ...context, apiFetch };
# }

content = content.replace("const { user } = useAuth();", "const { user, apiFetch } = useAuth();")

# Wait, DataContext does:
# const docs = await dbProxy.getDocs("agent_logs", { limit: 20, orderBy: [{ field: 'createdAt', direction: 'desc' }] });
content = re.sub(
    r'const docs = await dbProxy\.getDocs\("agent_logs", \{.*?\}\);',
    r"const docs = await (await apiFetch('/api/system_events')).json();",
    content,
    flags=re.DOTALL
)

with open('src/contexts/DataContext.tsx', 'w') as f:
    f.write(content)
