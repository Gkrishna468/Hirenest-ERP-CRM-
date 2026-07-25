const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Add import for sendPasswordResetEmail
content = content.replace(
  "import { useAuth } from \"@/contexts/AuthContext\";",
  "import { useAuth } from \"@/contexts/AuthContext\";\nimport { sendPasswordResetEmail } from \"firebase/auth\";\nimport { auth } from \"@/services/firebase/config\";"
);

// Replace Forgot Password onClick handler
content = content.replace(
  /onClick=\{\(\) =>\s+toast\.info\(\s*"Please contact your administrator to reset password",\s*\)\s*\}/,
  `onClick={async () => {
                      if (!email) {
                        toast.error("Please enter your email address first");
                        return;
                      }
                      try {
                        await sendPasswordResetEmail(auth, email);
                        toast.success("Password reset email sent! Please check your inbox.");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to send reset email");
                      }
                    }}`
);

fs.writeFileSync('src/pages/Login.tsx', content);
