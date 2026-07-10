with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

# Fix the broken join line by regex to catch any newline anomalies
import re
content = re.sub(
    r"const fSkills = sList\.map\(\(s: any\) => `• \$\{s\.trim\(\)\}`\)\.join\([\s\S]*?\);",
    r"const fSkills = sList.map((s: any) => `• ${s.trim()}`).join('\\n');",
    content
)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

