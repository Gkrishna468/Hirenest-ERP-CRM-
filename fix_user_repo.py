import re

with open('src/repositories/UserRepository.ts', 'r') as f:
    content = f.read()

# Replace dbProxy.getDocs with apiFetch
content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", 
"import { dbProxy } from '@/services/firebase/db-proxy';\nimport { auth } from '@/services/firebase/config';\n\nasync function apiFetch(url: string, options?: RequestInit) {\n  let token = '';\n  const execSession = localStorage.getItem('hirenest_exec_session');\n  if (execSession) {\n    token = 'executive-bypass-token';\n  } else if (auth.currentUser) {\n    token = await auth.currentUser.getIdToken();\n  } else {\n    token = localStorage.getItem('fb_token') || '';\n  }\n  const headers = {\n    'Content-Type': 'application/json',\n    ...options?.headers,\n    ...(token ? { 'Authorization': `Bearer ${token}` } : {})\n  };\n  const res = await fetch(url, { ...options, headers });\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({ error: res.statusText }));\n    throw new Error(err.error || err.message || \"API request failed\");\n  }\n  return res;\n}")

content = content.replace("const data = await dbProxy.getDoc('users', id);", "const res = await apiFetch(`/api/users/${id}`);\n      const data = await res.json();")
content = re.sub(r"const docs = await dbProxy.getDocs\('users', \{\s*where: \[\{ field: 'email', op: '==', value: email\.toLowerCase\(\)\.trim\(\) \}\]\s*\}\);", "const res = await apiFetch(`/api/users/email/${encodeURIComponent(email.toLowerCase().trim())}`);\n      const docs = [await res.json()];", content)
content = content.replace("await dbProxy.setDoc('users', id, user);", "await apiFetch(`/api/users`, { method: 'POST', body: JSON.stringify(user) });")
content = content.replace("await dbProxy.updateDoc('users', id, cleanUpdates);", "await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) });")
content = content.replace("await dbProxy.deleteDoc('users', id);", "await apiFetch(`/api/users/${id}`, { method: 'DELETE' });")
content = content.replace("const docs = await dbProxy.getDocs('users');", "const res = await apiFetch('/api/users');\n      const docs = await res.json();")

with open('src/repositories/UserRepository.ts', 'w') as f:
    f.write(content)
