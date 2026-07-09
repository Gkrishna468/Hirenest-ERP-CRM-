import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add imports
content = content.replace('import aiHandler from "./src/server/controllers/ai";', 'import aiRouter from "./src/server/routers/ai";')
content = content.replace('import gmailHandler from "./src/server/controllers/gmail";', 'import gmailRouter from "./src/server/routers/gmail";')

# Add app.use
content = content.replace('app.use("/api/auth", authRouter);', 'app.use("/api/auth", authRouter);\n    app.use("/api/ai", aiRouter);\n    app.use("/api/gmail", gmailRouter);')

# Remove app.all
content = re.sub(r'app\.all\("/api/ai", async \(req, res\) => \{.*?\}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'app\.all\("/api/gmail", async \(req, res\) => \{.*?\}\);\n', '', content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)
