import os

repos = [
    'src/repositories/VendorRepository.ts',
    'src/repositories/RequirementRepository.ts',
    'src/repositories/ClientRepository.ts',
    'src/repositories/CandidateRepository.ts',
    'src/repositories/SubmissionRepository.ts',
]

for repo in repos:
    if not os.path.exists(repo): continue
    with open(repo, 'r') as f:
        content = f.read()
    
    # replace apiFetch to check res.ok
    content = content.replace(
        '  return fetch(url, { ...options, headers });',
        '  const res = await fetch(url, { ...options, headers });\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({ error: res.statusText }));\n    throw new Error(err.error || err.message || "API request failed");\n  }\n  return res;'
    )
    with open(repo, 'w') as f:
        f.write(content)
