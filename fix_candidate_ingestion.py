import re

with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

# Fix submitCandidateToRequirement
content = content.replace(
    'const existingVaultDoc = await candidateRepository.findIdentityByEmailOrPhone(identityData.email, identityData.phone);',
    'const existingVaultDoc = await candidateRepository.findIdentityByHashEmailPhone(candidateHash || "", identityData.email, identityData.phone);'
)

# Fix submitToPool
content = content.replace(
    'const existingVaultDoc = await candidateRepository.findIdentityByEmailOrPhone(identityData.email, identityData.phone);',
    'const existingVaultDoc = await candidateRepository.findIdentityByHashEmailPhone(resumeHash || "", identityData.email, identityData.phone);'
)

# Fix candidateId assignment
content = content.replace('let candidateId = existingVaultDoc?.candidateId;', 'let candidateId = existingVaultDoc ? existingVaultDoc.id : null;')

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
