with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "submitCandidateToRequirement" in line:
        for j in range(i, i+10):
            if "existingVaultDoc" in lines[j]:
                lines[j] = lines[j].replace("resumeHash", "candidateHash")
                break
        break

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.writelines(lines)
