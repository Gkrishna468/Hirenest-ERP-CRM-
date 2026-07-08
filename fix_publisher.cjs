const fs = require('fs');
let content = fs.readFileSync('src/server/events/DomainEventPublisher.ts', 'utf8');
content = content.replace(/\\`\\\${event\.eventType} on \\\${event\.entityCollection}\/\\\${event\.entityId}\\`/g, '`${event.eventType} on ${event.entityCollection}/${event.entityId}`');
fs.writeFileSync('src/server/events/DomainEventPublisher.ts', content);
