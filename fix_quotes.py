import re

with open('src/pages/MarketingStudio.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
in_gen = False
for line in lines:
    if 'setGeneratedContent("🚀 Stop losing top IT talent' in line:
        line = line.replace('\n', '\\n').replace('setGeneratedContent("🚀 Stop losing top IT talent to slow feedback loops.\\n', '        setGeneratedContent(`🚀 Stop losing top IT talent to slow feedback loops.\n')
        in_gen = True
    elif 'setGeneratedContent("Subject: Exclusive Access:' in line:
        line = line.replace('\n', '\\n').replace('setGeneratedContent("Subject: Exclusive Access: Premium IT Requirements via HireNest Vendor OS\\n', '        setGeneratedContent(`Subject: Exclusive Access: Premium IT Requirements via HireNest Vendor OS\n')
        in_gen = True
    elif 'setGeneratedContent("Attention IT Staffing Vendors' in line:
        line = line.replace('\n', '\\n').replace('setGeneratedContent("Attention IT Staffing Vendors & Bench Partners 🚀\\n', '        setGeneratedContent(`Attention IT Staffing Vendors & Bench Partners 🚀\n')
        in_gen = True
    elif 'setGeneratedContent("The era of fragmented recruitment CRMs' in line:
        line = line.replace('\n', '\\n').replace('setGeneratedContent("The era of fragmented recruitment CRMs is over.\\n', '        setGeneratedContent(`The era of fragmented recruitment CRMs is over.\n')
        in_gen = True
    elif in_gen and '");' in line:
        line = line.replace('");', '`);')
        in_gen = False
    
    new_lines.append(line)

with open('src/pages/MarketingStudio.tsx', 'w') as f:
    f.writelines(new_lines)
