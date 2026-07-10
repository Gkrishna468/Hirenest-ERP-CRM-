import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

# Define the new generateJobTemplate
new_generate_template = """  const generateJobTemplate = (job: any, isVendor: boolean = false, sourceChannel: string = 'wa') => {
    const sList = Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',') : []);
    const fSkills = sList.map((s: any) => `• ${s.trim()}`).join('\\n');
    let expStr = formatExperienceRange(job);
    
    // Formatting Salary
    let salaryStr = formatSalaryRange(job);
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

# Replace existing generateJobTemplate
content = re.sub(r"const generateJobTemplate = \(job: any, isVendor: boolean = false, sourceChannel: string = 'wa'\) => \{[\s\S]*?Powered by Hirenest CRM AI`;\n  };", new_generate_template, content)

# 1. The inline whatsapp button in view modal
content = re.sub(r"const text = encodeURIComponent\(generateBroadcastText\(selectedJob, 'wa'\)\);", 
                 r"const text = encodeURIComponent(generateJobTemplate(selectedJob, false, 'wa'));", content)

# 2. The inline copy button in view modal
content = re.sub(r"const text = generateBroadcastText\(selectedJob, 'copy'\);", 
                 r"const text = generateJobTemplate(selectedJob, false, 'copy');", content)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

