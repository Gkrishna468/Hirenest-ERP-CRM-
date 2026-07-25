const fs = require('fs');
let content = fs.readFileSync('src/components/VendorAuth.tsx', 'utf8');

content = content.replace(
  "import { signInWithEmailAndPassword } from 'firebase/auth';",
  "import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';"
);

content = content.replace(
  /<label className="text-\[10px\] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Password<\/label>/g,
  `<div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        toast.error("Please enter your email first");
                        return;
                      }
                      try {
                        await sendPasswordResetEmail(auth, email);
                        toast.success("Password reset email sent!");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to send reset email");
                      }
                    }}
                    className="text-[10px] text-amber-500 hover:text-amber-400 font-bold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>`
);

fs.writeFileSync('src/components/VendorAuth.tsx', content);
