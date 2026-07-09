import os
import re

repos_dir = 'src/server/repositories'
services_dir = 'src/server/services'
routers_dir = 'src/server/routers'

def process_repo(filepath, collection_name, entity_type):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add import
    if 'BaseRepository' not in content:
        content = 'import { BaseRepository } from "./BaseRepository";\n' + content

    # Replace class declaration
    content = re.sub(r'export class (\w+) \{', rf'export class \1 extends BaseRepository<any> {{\n  protected collectionName = "{collection_name}";\n  protected entityType = "{entity_type}";\n', content)

    # Remove the standard CRUD methods that we are replacing
    # We will use regex to remove methods block by block if they exist
    methods_to_remove = [
        r'\s*private get db\(\): Firestore\s*\{\s*return getAdminDb\(\);\s*\}',
        r'\s*async runTransaction<T>\(.*?\) \: Promise<T> \{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\}',
        r'\s*async getById\(.*?\) \: Promise<any> \{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\}',
        r'\s*async list\(.*?\) \: Promise<any\[\]> \{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\}',
        r'\s*async create\(id: string, data: any, transaction\?: Transaction\) \: Promise<void> \{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\}',
        r'\s*async update\(id: string, data: any, transaction\?: Transaction\) \: Promise<void> \{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\}',
        r'\s*async delete\(id: string, transaction\?: Transaction\) \: Promise<void> \{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\}',
    ]

    for m in methods_to_remove:
        content = re.sub(m, '', content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)


process_repo(f'{repos_dir}/ClientRepository.ts', 'clients', 'client')
process_repo(f'{repos_dir}/VendorRepository.ts', 'vendors', 'vendor')
process_repo(f'{repos_dir}/CandidateRepository.ts', 'candidates', 'candidate')
process_repo(f'{repos_dir}/RequirementRepository.ts', 'requirements', 'requirement')
process_repo(f'{repos_dir}/SubmissionRepository.ts', 'submissions', 'submission')

