import re

def add_event(content, collection_name):
    # For POST (create)
    post_pattern = r"(await db\.collection\(\"[^\"]+\"\)\.doc\(data\.id\)\.set\(data, \{ merge: true \}\);|await db\.collection\(\"[^\"]+\"\)\.doc\(data\.id\)\.set\(data\);)"
    post_repl = r"\1\n    await db.collection('system_events').doc().set({ eventType: 'CREATED', entityCollection: '" + collection_name + "', entityId: data.id, timestamp: new Date().toISOString() });"
    content = re.sub(post_pattern, post_repl, content)

    # For PUT (update)
    put_pattern = r"(await db\.collection\(\"[^\"]+\"\)\.doc\(req\.params\.id\)\.update\(data\);)"
    put_repl = r"\1\n    await db.collection('system_events').doc().set({ eventType: 'UPDATED', entityCollection: '" + collection_name + "', entityId: req.params.id, timestamp: new Date().toISOString() });"
    content = re.sub(put_pattern, put_repl, content)

    # For DELETE
    delete_pattern = r"(await db\.collection\(\"[^\"]+\"\)\.doc\(req\.params\.id\)\.delete\(\);)"
    delete_repl = r"\1\n    await db.collection('system_events').doc().set({ eventType: 'DELETED', entityCollection: '" + collection_name + "', entityId: req.params.id, timestamp: new Date().toISOString() });"
    content = re.sub(delete_pattern, delete_repl, content)

    return content

with open('src/server/routers/users.ts', 'r') as f:
    users_content = f.read()
users_content = add_event(users_content, 'users')
with open('src/server/routers/users.ts', 'w') as f:
    f.write(users_content)

with open('src/server/routers/deals.ts', 'r') as f:
    deals_content = f.read()
deals_content = add_event(deals_content, 'deals')
with open('src/server/routers/deals.ts', 'w') as f:
    f.write(deals_content)

