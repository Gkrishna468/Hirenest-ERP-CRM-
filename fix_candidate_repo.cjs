const fs = require('fs');
let c = fs.readFileSync('src/server/repositories/CandidateRepository.ts', 'utf8');

c = c.replace(/async getRequirement\(reqId: string\): Promise<any> \{/g, 'async getRequirement(reqId: string, transaction?: any): Promise<any> {');
c = c.replace(/async getAiReprocessingQueuePending\(\): Promise<any\[\]> \{/g, 'async getAiReprocessingQueuePending(transaction?: any): Promise<any[]> {');
c = c.replace(/async getCandidateAvailability\(candidateId: string\): Promise<any\[\]> \{/g, 'async getCandidateAvailability(candidateId: string): Promise<any> {');

fs.writeFileSync('src/server/repositories/CandidateRepository.ts', c);
