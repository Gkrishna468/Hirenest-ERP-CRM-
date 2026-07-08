const fs = require('fs');
let c = fs.readFileSync('src/server/events/DomainEventPublisher.ts', 'utf8');
c = c.replace(/message: event\.message \|\| .*,/, 'message: event.message || (event.eventType + " on " + event.entityCollection + "/" + event.entityId),');
fs.writeFileSync('src/server/events/DomainEventPublisher.ts', c);
