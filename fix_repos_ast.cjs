const fs = require('fs');
const path = require('path');

const reposDir = path.join(__dirname, 'src/server/repositories');
const files = ['CandidateRepository.ts', 'ClientRepository.ts', 'VendorRepository.ts', 'RequirementRepository.ts', 'SubmissionRepository.ts'];

const methodsToRemove = [
    'private get db()',
    'async runTransaction',
    'async getById',
    'async list()',
    'async create(',
    'async update(',
    'async delete('
];

function extractMethods(content) {
    let result = '';
    let inMethod = false;
    let braceCount = 0;
    let methodLines = [];
    
    let isRemoving = false;

    const lines = content.split('\n');
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        let shouldRemove = false;
        if (!inMethod) {
            for (const m of methodsToRemove) {
                if (line.includes(m)) {
                    isRemoving = true;
                    shouldRemove = true;
                    break;
                }
            }
        }
        
        if (isRemoving) {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount === 0) {
                isRemoving = false;
                inMethod = false;
            } else {
                inMethod = true;
            }
            continue;
        }
        
        newLines.push(line);
    }
    
    return newLines.join('\n');
}

for (const file of files) {
    const p = path.join(reposDir, file);
    let c = fs.readFileSync(p, 'utf8');
    
    if (!c.includes('import { BaseRepository }')) {
        c = 'import { BaseRepository } from "./BaseRepository";\n' + c;
    }
    
    const collectionName = file.replace('Repository.ts', '').toLowerCase() + 's';
    const entityType = file.replace('Repository.ts', '').toLowerCase();
    
    c = c.replace(/export class (\w+) \{/, `export class $1 extends BaseRepository<any> {\n  protected collectionName = "${collectionName}";\n  protected entityType = "${entityType}";\n`);
    
    c = extractMethods(c);
    
    fs.writeFileSync(p, c);
}
