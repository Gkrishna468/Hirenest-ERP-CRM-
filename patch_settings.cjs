const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
code = code.replace(
  "'/api/auth?action=admin-reset-password'",
  "'/api/auth/users/reset-password'"
);
code = code.replace(
  "'/api/auth?action=admin-delete-user', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n          targetUserId: deletingUser.id\n        })\n      }",
  "`/api/auth/users/${deletingUser.id}`, {\n        method: 'DELETE',\n        headers: {\n          'Content-Type': 'application/json'\n        }\n      }"
);
code = code.replace(
  "`/api/auth?action=url&userId=${user?.id}`",
  "`/api/auth/google/url?userId=${user?.id}`"
);
code = code.replace(
  "{window.location.origin}/api/auth?action=callback",
  "{window.location.origin}/api/auth/google/callback"
);
fs.writeFileSync('src/pages/Settings.tsx', code);
