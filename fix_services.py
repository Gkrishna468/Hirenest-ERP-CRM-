import os
import re

services_dir = 'src/server/services'

def rewrite_service(filepath, repo_var, entity_name):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. getById -> findById
    content = re.sub(rf'{repo_var}\.getById\(', f'{repo_var}.findById(', content)
    
    # 2. list -> findAll
    content = re.sub(rf'{repo_var}\.list\(', f'{repo_var}.findAll(', content)

    # 3. rewrite create method
    # It usually looks like:
    # async create(data: any, performedBy: string = 'System') { ... return x; }
    # Let's just find `db.runTransaction` and remove it, replace with repo call
    # Actually it's easier to just do it via regex
    content = re.sub(r'const db = getAdminDb\(\);.*?await db\.runTransaction\(async \(transaction\) => \{.*?await \w+Repository\.create\(([^,]+), ([^,]+), transaction\);.*?\}\);', 
                     rf'return await {repo_var}.create(\2, performedBy);', content, flags=re.DOTALL)

    content = re.sub(r'const db = getAdminDb\(\);.*?await db\.runTransaction\(async \(transaction\) => \{.*?await \w+Repository\.update\(([^,]+), ([^,]+), transaction\);.*?\}\);', 
                     rf'await {repo_var}.update(\1, \2, performedBy);', content, flags=re.DOTALL)

    content = re.sub(r'const db = getAdminDb\(\);.*?await db\.runTransaction\(async \(transaction\) => \{.*?await \w+Repository\.delete\(([^,]+), transaction\);.*?\}\);', 
                     rf'await {repo_var}.archive(\1, performedBy);', content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

rewrite_service(f'{services_dir}/RequirementService.ts', 'requirementRepository', 'requirement')
rewrite_service(f'{services_dir}/CandidateService.ts', 'candidateRepository', 'candidate')
rewrite_service(f'{services_dir}/SubmissionService.ts', 'submissionRepository', 'submission')
rewrite_service(f'{services_dir}/ClientService.ts', 'clientRepository', 'client')
rewrite_service(f'{services_dir}/VendorService.ts', 'vendorRepository', 'vendor')

