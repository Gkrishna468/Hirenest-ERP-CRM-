import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

# Define the single template generation function at the top level or inside the component
new_generate_template = """  const generateBroadcastText = (job: any, sourceChannel: string) => {
    const sList = Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',') : []);
    const fSkills = sList.map((s: any) => `• ${s.trim()}`).join('\\n');
    let expStr = "3-5 Years";
    if (job.experienceMin !== undefined && job.experienceMax !== undefined) {
       expStr = `${job.experienceMin}-${job.experienceMax} Years`;
    }
    
    // Formatting Salary
    let salaryStr = job.budget || "₹12–15 LPA";
    if (job.pricing_data?.requirementType === 'C2C') {
       salaryStr = `₹${parseFloat(job.pricing_data?.c2cClientBillingLpm || 0).toLocaleString()} LPM`;
    } else if (job.pricing_data?.requirementType === 'C2H') {
       salaryStr = `₹${parseFloat(job.pricing_data?.c2hSalaryLpa || 0).toLocaleString()} LPA`;
    }

    const type = job.pricing_data?.requirementType || job.type || "Full-Time (FTE)";
    const mode = job.pricing_data?.workMode || job.workMode || "Remote";
    let locationBadge = "🟢 Remote";
    if (mode === 'Hybrid') locationBadge = "🟡 Hybrid";
    if (mode === 'Onsite') locationBadge = "🔵 Onsite";
    
    const applyUrl = `${window.location.origin}/#/apply/${job.id}?src=${sourceChannel}`;
    const vendorUrl = `${window.location.origin}/#/vendor-submit/${job.id}`;

    let linksSection = '';
    if (type === 'C2C' || type === 'Contract-to-Contract (C2C)') {
      linksSection = `📤 Vendors Submit Candidates
${vendorUrl}

⚠ Public applications are not accepted for this requirement.`;
    } else {
      linksSection = `📄 Apply
${applyUrl}

📤 Vendor Submission
${vendorUrl}`;
    }

    return `🚀 Immediate Hiring | ${job.title}

📍 Location: ${job.location || 'Remote'}
💼 Employment: ${type}
${locationBadge}
💰 Budget/Salary: ${salaryStr}
👥 Openings: ${job.openings || 1}
⚡ Experience: ${expStr}

🛠 Skills
${fSkills || '• Core competencies'}

${linksSection}

🤖 Powered by HireNest Workforce`;
  };"""

# Replace existing generateWhatsappTemplate
content = re.sub(r"const generateWhatsappTemplate = \(job: any, sourceChannel: string\) => \{[\s\S]*?Powered by Hirenest CRM AI`;\n  };", new_generate_template, content)

# Now find where the inline templates are in the DOM and replace them
# 1. The inline whatsapp button in view modal
content = re.sub(r"const text = encodeURIComponent\(`🚀 Immediate Hiring \| \$\{selectedJob\.title\}[\s\S]*?\$\{window\.location\.origin\}/#/vendor-submit/\$\{selectedJob\.id\}`\);", 
                 r"const text = encodeURIComponent(generateBroadcastText(selectedJob, 'wa'));", content)

# 2. The inline copy button in view modal
content = re.sub(r"const text = `🚀 Immediate Hiring \| \$\{selectedJob\.title\}[\s\S]*?\$\{window\.location\.origin\}/#/vendor-submit/\$\{selectedJob\.id\}`;", 
                 r"const text = generateBroadcastText(selectedJob, 'copy');", content)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

