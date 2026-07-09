import re

with open('src/repositories/SystemRepository.ts', 'r') as f:
    content = f.read()

content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", 
"import { dbProxy } from '@/services/firebase/db-proxy';\nimport { auth } from '@/services/firebase/config';\n\nasync function apiFetch(url: string, options?: RequestInit) {\n  let token = '';\n  const execSession = localStorage.getItem('hirenest_exec_session');\n  if (execSession) {\n    token = 'executive-bypass-token';\n  } else if (auth.currentUser) {\n    token = await auth.currentUser.getIdToken();\n  } else {\n    token = localStorage.getItem('fb_token') || '';\n  }\n  const headers = {\n    'Content-Type': 'application/json',\n    ...options?.headers,\n    ...(token ? { 'Authorization': `Bearer ${token}` } : {})\n  };\n  const res = await fetch(url, { ...options, headers });\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({ error: res.statusText }));\n    throw new Error(err.error || err.message || \"API request failed\");\n  }\n  return res;\n}")

content = content.replace("await dbProxy.setDoc('system_events', id, event);", "await apiFetch('/api/system_events', { method: 'POST', body: JSON.stringify(event) });")
content = content.replace("dbProxy.getDocs(collectionName).then(docs => callback(docs.length)).catch(onError);", "apiFetch(`/api/system_events/count/${collectionName}`).then(res => res.json()).then(data => callback(data.count)).catch(onError);")

content = re.sub(r"const docs = await dbProxy\.getDocs\('system_events', \{.*?limit: 20\s*\}\);", "const res = await apiFetch('/api/system_events');\n      const docs = await res.json();", content, flags=re.DOTALL)

with open('src/repositories/SystemRepository.ts', 'w') as f:
    f.write(content)
