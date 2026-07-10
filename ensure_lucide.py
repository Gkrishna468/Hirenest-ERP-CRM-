with open("src/pages/VendorPortal.tsx", "r") as f:
    content = f.read()

import re
if "Building2" not in content:
    content = re.sub(r'import \{([\s\S]*?)\} from "lucide-react";', r'import {\1, Building2} from "lucide-react";', content)

with open("src/pages/VendorPortal.tsx", "w") as f:
    f.write(content)
