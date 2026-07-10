import re

with open("src/pages/VendorPortal.tsx", "r") as f:
    content = f.read()

# Add company name state
if "const [vendorCompanyInput, setVendorCompanyInput] = useState('');" not in content:
    content = content.replace("const [vendorPasswordInput, setVendorPasswordInput] = useState('');", 
                              "const [vendorPasswordInput, setVendorPasswordInput] = useState('');\n  const [vendorCompanyInput, setVendorCompanyInput] = useState('');")

# Add input for company name in the form
old_form_part = """              <div className="space-y-4">
                <div className="relative">"""

new_form_part = """              <div className="space-y-4">
                {isRegistering && (
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-slate-600" />
                      </div>
                      <input
                        type="text"
                        placeholder="Company Name"
                        required={isRegistering}
                        value={vendorCompanyInput}
                        onChange={(e) => setVendorCompanyInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                   </div>
                )}
                <div className="relative">"""

content = content.replace(old_form_part, new_form_part)


old_register = """      if (isRegistering) {
        // Mock registration flow for now, normally you'd collect more fields
        await signUp(vendorEmailInput, vendorPasswordInput, vendorEmailInput.split('@')[0], 'vendor');
        toast.success("Organization Registered! Pending Admin Verification.");"""

new_register = """      if (isRegistering) {
        if (!vendorCompanyInput.trim()) {
           toast.error("Please enter your Company Name");
           return;
        }
        await signUp(vendorEmailInput, vendorPasswordInput, vendorCompanyInput.trim(), 'vendor');
        toast.success("Organization Registered! Pending Admin Verification.");"""

content = content.replace(old_register, new_register)


# We need to make sure Building2 is imported
if "Building2" not in content:
    content = content.replace("from 'lucide-react';", "Building2, \nfrom 'lucide-react';")

with open("src/pages/VendorPortal.tsx", "w") as f:
    f.write(content)

