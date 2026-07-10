import re

with open("src/pages/VendorPortal.tsx", "r") as f:
    content = f.read()

# Add company name state
if "const [vendorCompanyInput, setVendorCompanyInput] = useState('');" not in content:
    content = content.replace('const [vendorPasswordInput, setVendorPasswordInput] = useState("");', 
                              'const [vendorPasswordInput, setVendorPasswordInput] = useState("");\n  const [vendorCompanyInput, setVendorCompanyInput] = useState("");')

# Fix UI injection.
old_form = """              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">"""

new_form = """              <div className="space-y-4">
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
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">"""

content = content.replace(old_form, new_form)

if "Building2" not in content:
    content = content.replace("Building,", "Building, Building2,")

with open("src/pages/VendorPortal.tsx", "w") as f:
    f.write(content)

