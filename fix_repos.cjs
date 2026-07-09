const fs = require('fs');
const path = require('path');

const reposDir = path.join(__dirname, 'src/server/repositories');
const files = ['CandidateRepository.ts', 'ClientRepository.ts', 'VendorRepository.ts', 'RequirementRepository.ts', 'SubmissionRepository.ts'];

for (const file of files) {
    const p = path.join(reposDir, file);
    let c = fs.readFileSync(p, 'utf8');

    // Remove runTransaction, getById, list, create, update, delete
    c = c.replace(/async runTransaction<T>.*?\n\s*\}/s, '');
    c = c.replace(/async getById\(.*?\n\s*\}/s, '');
    c = c.replace(/async list\(.*?\n\s*\}/s, '');
    c = c.replace(/async create\(id: string, data: any, transaction\?: Transaction\).*?\n\s*\}/s, '');
    c = c.replace(/async update\(id: string, data: any, transaction\?: Transaction\).*?\n\s*\}/s, '');
    c = c.replace(/async delete\(id: string, transaction\?: Transaction\).*?\n\s*\}/s, '');
    
    // Also remove the "private get db" if present
    c = c.replace(/private get db\(\): Firestore {.*?\n\s*\}/s, '');

    fs.writeFileSync(p, c);
}
