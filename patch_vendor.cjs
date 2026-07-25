const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

// Add import
content = content.replace(
  "import { useAuth } from '@/contexts/AuthContext';",
  "import { useAuth } from '@/contexts/AuthContext';\nimport { sendPasswordResetEmail } from 'firebase/auth';\nimport { auth } from '@/services/firebase/config';"
);

// Add the button
content = content.replace(
  /                        <button onClick=\{\(e\) => handleDeleteVendor\(e, vendor\.id\)\} className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded">/,
  `                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(\`Send password reset email to \${vendor.email}?\`)) {
                              try {
                                await sendPasswordResetEmail(auth, vendor.email);
                                toast.success(\`Password reset email sent to \${vendor.email}\`);
                              } catch(err: any) {
                                toast.error(err.message || "Failed to send reset email");
                              }
                            }
                          }}
                          className="p-1 hover:bg-amber-50 text-amber-400 hover:text-amber-600 rounded"
                          title="Reset Password"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                        <button onClick={(e) => handleDeleteVendor(e, vendor.id)} className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded" title="Delete Vendor">`
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
