import os
import re

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

    # Add import
    if "from '@/services/firebase/config'" not in content:
        content = "import { auth } from '@/services/firebase/config';\n" + content
    
    # Replace apiFetch token logic
    content = re.sub(r'  let token = \'\';.*?token = localStorage\.getItem\(\'fb_token\'\) \|\| \'\';\n  \}', 
        '''  let token = '';
  const execSession = localStorage.getItem('hirenest_exec_session');
  if (execSession) {
    token = 'executive-bypass-token';
  } else if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }''', content, flags=re.DOTALL)
    
    with open(repo, 'w') as f:
        f.write(content)
