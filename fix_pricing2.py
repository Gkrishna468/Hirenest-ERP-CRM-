import re

with open('src/repositories/PricingRepository.ts', 'r') as f:
    content = f.read()

content = content.replace("const docs = await dbProxy.getDocs('deals');", 
"const res = await apiFetch('/api/deals');\n      const docs = await res.json();")

with open('src/repositories/PricingRepository.ts', 'w') as f:
    f.write(content)
