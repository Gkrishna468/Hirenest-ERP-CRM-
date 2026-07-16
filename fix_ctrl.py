with open('src/server/controllers/candidates.ts', 'r') as f:
    content = f.read()

content = content.replace('const result = await candidateIngestionService.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData, candidateHash);', 'const result = (await candidateIngestionService.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData, candidateHash)) as any;')
content = content.replace('const result = await candidateIngestionService.submitToPool(vendorId, candidateName, identityData, resumeHash);', 'const result = (await candidateIngestionService.submitToPool(vendorId, candidateName, identityData, resumeHash)) as any;')

with open('src/server/controllers/candidates.ts', 'w') as f:
    f.write(content)
