const fs = require('fs');
let code = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const regex = /const overlap = candSkills\.filter[^}]*score \+= 45;\s*}\s*}/m;
const match = code.match(regex);
if (match) {
  const newMatchStr = `let score = 0;
        try {
          const aiMatch = await requirementMatchParser.match(candidate, reqItem);
          score = aiMatch.score;
        } catch (error) {
          console.warn("[CandidateIngestionService] AI match failed, falling back to basic matching", error);
          const overlap = candSkills.filter((s: string) => 
            reqSkills.some((rs: string) => rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase()))
          );
          score = Math.round((overlap.length / Math.max(reqSkills.length, 1)) * 100);
          if (score < 40 && reqItem.title && candidate.currentTitle && reqItem.title.toLowerCase().includes(candidate.currentTitle.toLowerCase())) {
            score += 45;
          }
        }`;
  code = code.replace(match[0], newMatchStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', code);
  console.log("Replaced successfully.");
} else {
  console.log("Could not find match.");
}
