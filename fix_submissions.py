import re
with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

if 'import { submissionService }' not in content:
    content = content.replace('import { candidateService } from "./CandidateService";', 'import { candidateService } from "./CandidateService";\nimport { submissionService } from "./SubmissionService";')

content = re.sub(r'await db\.collection\("candidate_submissions"\)\.add\(\{(.*?createdAt:.*?)\}\);',
                 r'await submissionService.create({\1}, vendorId, { workspace: "Vendor", vendorId });', content, flags=re.DOTALL)

# Remove the orphan transaction block for submission_ledger
orphan_pattern = re.compile(r'  \}\n\n      transaction\.set\(db\.collection\("submission_ledger"\)\.doc\(\), \{.*?\};\n    \}\);\n  \}', re.DOTALL)

if orphan_pattern.search(content):
    content = orphan_pattern.sub('  }', content)

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
