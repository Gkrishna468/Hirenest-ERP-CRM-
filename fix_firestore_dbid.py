import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            if 'firestoreDatabaseId' in content:
                content = re.sub(r'let firestoreDbId.*?;', '', content)
                content = re.sub(r'if \(firebaseConfig\.firestoreDatabaseId\) firestoreDbId = firebaseConfig\.firestoreDatabaseId;', '', content)
                content = re.sub(r'firestoreDatabaseId: undefined', '', content)
                content = re.sub(r'firestoreDatabaseId: firestoreDbId', '', content)
                with open(filepath, 'w') as f:
                    f.write(content)
