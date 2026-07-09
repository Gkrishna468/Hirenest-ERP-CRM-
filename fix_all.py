import os
import re

for file in os.listdir('src/server/controllers'):
    if not file.endswith('.ts'): continue
    filepath = os.path.join('src/server/controllers', file)
    with open(filepath, 'r') as f:
        content = f.read()

    if 'firebase-admin/app' not in content: continue

    # Strip all firebase admin imports
    content = re.sub(r'import \{[^}]*\} from "firebase-admin/[^"]+";\n', '', content)

    # Strip fs and path
    content = re.sub(r'import \* as fs from "fs";\n', '', content)
    content = re.sub(r'import \* as path from "path";\n', '', content)

    # Find the export/const/function to start the real code
    match = re.search(r'\n(export |const |export default |export function |class |const router )', content)
    if match:
        idx = match.start()
        imports_end = 0
        for m in re.finditer(r'^import .*?;?\n', content[:idx], re.MULTILINE):
            imports_end = m.end()
            
        header = content[:imports_end]
        rest = content[idx:]
        
        content = header + '\nimport { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";\n' + rest

    # Replace local `db` usage
    content = content.replace('await db.collection', 'await getAdminDb().collection')
    content = content.replace(' db.collection', ' getAdminDb().collection')
    content = content.replace('(db)', '(getAdminDb())')
    content = content.replace('db = getFirestore', '// db = getFirestore')
    content = content.replace('getAdminAuth(adminApp)', 'getAdminAuthClient()')
    content = content.replace('getFirestoreDB()', 'getAdminDb()')
    content = content.replace('!db', '!getAdminDb()')

    with open(filepath, 'w') as f:
        f.write(content)
