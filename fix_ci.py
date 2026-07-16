import re

with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

if 'import { submissionService }' not in content:
    content = content.replace('import { candidateService } from "./CandidateService";', 'import { candidateService } from "./CandidateService";\nimport { submissionService } from "./SubmissionService";')

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)

with open('src/server/controllers/candidates.ts', 'r') as f:
    content2 = f.read()

content2 = content2.replace('const result = await candidateIngestionService.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData);', 'const result = await candidateIngestionService.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData) as any;')
with open('src/server/controllers/candidates.ts', 'w') as f:
    f.write(content2)

