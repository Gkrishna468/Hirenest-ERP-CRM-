import os
import re

for root, _, files in os.walk('src'):
    if 'server' in root: continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # /api/ai?action=XYZ -> /api/ai/XYZ
            content = re.sub(r'/api/ai\?action=([a-zA-Z0-9_-]+)', r'/api/ai/\1', content)
            
            # /api/gmail?action=list&userId=... -> /api/gmail/list?userId=...
            # Note: The original was `/api/gmail?action=list${userQuery}` where userQuery is `&userId=...`
            # This will become `/api/gmail/list${userQuery}` which would mean `/api/gmail/list&userId=...` instead of `?userId=...`
            # We need to handle this properly.
            
            content = content.replace('`/api/gmail?action=list${userQuery}`', '`/api/gmail/list${userQuery.replace("&", "?", 1)}`')
            content = content.replace('`/api/gmail?action=sync&userId=', '`/api/gmail/sync?userId=')
            content = content.replace('"/api/gmail?action=send"', '"/api/gmail/send"')
            content = content.replace('`/api/gmail?action=status&userId=', '`/api/gmail/status?userId=')

            with open(filepath, 'w') as f:
                f.write(content)
