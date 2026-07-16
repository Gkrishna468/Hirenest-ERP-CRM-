import re

with open('src/server/routers/broker.ts', 'r') as f:
    content = f.read()

# fix 438 duplicate
content = content.replace(
'''          vendorName: "Stirling PDF Intake",
          organizationId: payload?.organizationId || "bootstrap-org",
          stage: "available", organizationId: payload?.organizationId || "bootstrap-org" }, "broker-crawler", { organizationId: payload?.organizationId || "bootstrap-org" });''',
'''          vendorName: "Stirling PDF Intake",
          organizationId: payload?.organizationId || "bootstrap-org"
        }, "broker-ocr", { organizationId: payload?.organizationId || "bootstrap-org" });''')

# 518 duplicate
content = content.replace(
'''            vendorName: "Browser Use automation",
            organizationId: payload?.organizationId || "bootstrap-org",
            stage: "available",
            stage: "available", organizationId: payload?.organizationId || "bootstrap-org" }, "broker-crawler", { organizationId: payload?.organizationId || "bootstrap-org" });''',
'''            vendorName: "Browser Use automation",
            stage: "available",
            organizationId: payload?.organizationId || "bootstrap-org"
        }, "broker-crawler", { organizationId: payload?.organizationId || "bootstrap-org" });''')

# Add missing requirementService import if it's not there
if 'import { requirementService }' not in content:
    content = content.replace('import { candidateService } from "../services/CandidateService";', 'import { candidateService } from "../services/CandidateService";\nimport { requirementService } from "../services/RequirementService";')


with open('src/server/routers/broker.ts', 'w') as f:
    f.write(content)
