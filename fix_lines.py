with open("src/pages/Requirements.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const fSkills = sList.map((s: any)" in line:
        lines[i] = "    const fSkills = sList.map((s: any) => `• ${s.trim()}`).join('\\n');\n"
        if len(lines) > i + 1 and lines[i+1].strip() == "');" or lines[i+1].strip() == "\\n');":
             lines[i+1] = ""
        if len(lines) > i + 1 and "\\n');" in lines[i+1]:
             lines[i+1] = ""

with open("src/pages/Requirements.tsx", "w") as f:
    f.writelines(lines)

