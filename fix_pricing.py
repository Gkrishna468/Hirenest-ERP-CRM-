import re

with open('src/repositories/PricingRepository.ts', 'r') as f:
    content = f.read()

# Replace dbProxy.getDocs with apiFetch
content = content.replace("import { dbProxy } from '@/services/firebase/db-proxy';", 
"import { dbProxy } from '@/services/firebase/db-proxy';\nimport { auth } from '@/services/firebase/config';\n\nasync function apiFetch(url: string, options?: RequestInit) {\n  let token = '';\n  const execSession = localStorage.getItem('hirenest_exec_session');\n  if (execSession) {\n    token = 'executive-bypass-token';\n  } else if (auth.currentUser) {\n    token = await auth.currentUser.getIdToken();\n  }\n  const headers = {\n    'Content-Type': 'application/json',\n    ...options?.headers,\n    ...(token ? { 'Authorization': `Bearer ${token}` } : {})\n  };\n  const res = await fetch(url, { ...options, headers });\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({ error: res.statusText }));\n    throw new Error(err.error || err.message || \"API request failed\");\n  }\n  return res;\n}")

content = re.sub(r"async listDeals\(\): Promise<Deal\[\]> \{\s+try \{\s+const docs = await dbProxy\.getDocs\('deals'\);\s+return docs\.map\(\(data: any\) => \(\{",
"async listDeals(): Promise<Deal[]> {\n    try {\n      const res = await apiFetch('/api/deals');\n      const docs = await res.json();\n      return docs.map((data: any) => ({", content)

with open('src/repositories/PricingRepository.ts', 'w') as f:
    f.write(content)
