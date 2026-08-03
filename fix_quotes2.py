import re

with open('src/pages/MarketingStudio.tsx', 'r') as f:
    content = f.read()

handle_generate_replacement = """  const handleGenerate = () => {
    setIsGenerating(true);
    setIsPublished(false);
    setTimeout(() => {
      if (contentType === 'client' && platform === 'linkedin') {
        setGeneratedContent("🚀 Stop losing top IT talent to slow feedback loops.\\n\\nAt HireNest, our Enterprise Workforce Intelligence platform reduces time-to-fill by 60%. How? By replacing spreadsheets with an AI-driven Single Source of Truth that unites recruiters, hiring managers, and vendors in real-time.\\n\\n✅ 98% Match Accuracy\\n✅ 24-Hour Average Submission Time\\n✅ Automated Vendor Orchestration\\n\\nIs your staffing supply chain ready for AI? Let's talk.\\n\\n#ITStaffing #FutureOfWork #HireNestOS #TechHiring #AI");
      } else if (contentType === 'vendor' && platform === 'email') {
        setGeneratedContent("Subject: Exclusive Access: Premium IT Requirements via HireNest Vendor OS\\n\\nHi Team,\\n\\nWe are actively onboarding premium vendors to the HireNest Vendor Marketplace. Gain instant access to high-priority requirements from top global systems integrators and enterprise clients.\\n\\nWhy join?\\n🔹 Zero friction submissions through our Vendor OS\\n🔹 Transparent feedback SLAs (No more black holes)\\n🔹 Live AI requirement matching for your bench\\n🔹 Faster vendor payouts & streamlined invoicing\\n\\nReply to this email to get your exclusive invite code.\\n\\nBest regards,\\nChief of Digital Marketing, HireNest");
      } else if (contentType === 'vendor' && platform === 'linkedin') {
        setGeneratedContent("Attention IT Staffing Vendors & Bench Partners 🚀\\n\\nWe are actively onboarding premium vendors to the HireNest Vendor Marketplace. Gain instant access to high-priority requirements from top global systems integrators and enterprise clients.\\n\\nWhy join?\\n🔹 Zero friction submissions through our Vendor OS\\n🔹 Transparent feedback SLAs (No more black holes)\\n🔹 Live AI requirement matching for your bench\\n🔹 Faster vendor payouts & streamlined invoicing\\n\\nDrop a comment or DM to get your exclusive invite code.\\n\\n#StaffingAgencies #BenchSales #ITRecruitment #HireNest");
      } else {
        setGeneratedContent("The era of fragmented recruitment CRMs is over.\\n\\nIntroducing HireNest OS Phase 7: The complete Workforce Intelligence Operating System. \\n\\nFrom Requirement Intake to Vendor Distribution, AI-Matching, and Invoicing—everything executes on a single Event-Driven Architecture.\\n\\nEmpower your recruiters to be strategic advisors, not data-entry clerks. AI handles the pipeline; you handle the relationships.\\n\\nExplore early access today. Link in comments👇");
      }
      setIsGenerating(false);
    }, 1500);
  };"""

content = re.sub(
    r"  const handleGenerate.*?}, 1500\);\n  };",
    handle_generate_replacement,
    content,
    flags=re.DOTALL
)

with open('src/pages/MarketingStudio.tsx', 'w') as f:
    f.write(content)
