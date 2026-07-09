import os
import re

repos = [
    'src/repositories/VendorRepository.ts',
    'src/repositories/RequirementRepository.ts',
    'src/repositories/ClientRepository.ts',
    'src/repositories/CandidateRepository.ts',
    'src/repositories/SubmissionRepository.ts',
    'src/repositories/PricingRepository.ts'
]

for repo in repos:
    if not os.path.exists(repo): continue
    with open(repo, 'r') as f:
        content = f.read()

    # Replace apiFetch token logic
    content = re.sub(r'  \} else if \(auth\.currentUser\) \{\n    token = await auth\.currentUser\.getIdToken\(\);\n  \}', 
        '''  } else if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  } else {
    token = localStorage.getItem('fb_token') || '';
  }''', content, flags=re.DOTALL)
    
    with open(repo, 'w') as f:
        f.write(content)
