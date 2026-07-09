import re

with open('src/server/routers/deals.ts', 'r') as f:
    content = f.read()

content = content.replace('db.collection("deals")', 'db.collection("placements")')

with open('src/server/routers/deals.ts', 'w') as f:
    f.write(content)
