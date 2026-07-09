import re

with open('src/server/controllers/auth.ts', 'r') as f:
    content = f.read()

# Strip all firebase admin imports
content = re.sub(r'import \{[^}]*\} from "firebase-admin/[^"]+";\n', '', content)

# Strip fs and path
content = content.replace('import * as fs from "fs";\nimport * as path from "path";\n', '')

# Replace everything from "let db: Firestore" to "} else {" and the following lines up to "const ALGORITHM"
pattern = re.compile(r'let db: Firestore \| null = null;.*?const ALGORITHM =', re.DOTALL)
content = pattern.sub('import { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";\n\nconst ALGORITHM =', content)

# Replace local `db` and `adminApp` uses inside the functions with function calls
content = content.replace('getAdminAuth(adminApp)', 'getAdminAuthClient()')
content = content.replace('await db.collection', 'await getAdminDb().collection')

with open('src/server/controllers/auth.ts', 'w') as f:
    f.write(content)
