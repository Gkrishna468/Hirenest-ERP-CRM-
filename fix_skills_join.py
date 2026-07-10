with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

# Replace the broken join
old_str = "join('\n');"
new_str = "join('\\n');"
content = content.replace(old_str, new_str)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

