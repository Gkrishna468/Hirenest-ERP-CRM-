const fs = require('fs');
let code = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

code = code.replace(`    const txResult = await db.runTransaction(async (transaction) => {`,
`    console.log("[IngestService] STEP 4: Running Transaction for Identity/Candidate...");
    const txResult = await db.runTransaction(async (transaction) => {`);

code = code.replace(`    const dbAdmin = getAdminDb();`,
`    const dbAdmin = getAdminDb();
    console.log("[IngestService] STEP 5: Candidate Save OK. ID:", candidateId);`);

code = code.replace(`    await DomainEventPublisher.publishDomainEvent(`,
`    console.log("[IngestService] STEP 6: Projection Engine (Domain Events)...");
    await DomainEventPublisher.publishDomainEvent(`);

fs.writeFileSync('src/server/services/CandidateIngestionService.ts', code);
