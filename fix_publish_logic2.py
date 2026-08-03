import re

with open('src/pages/MarketingStudio.tsx', 'r') as f:
    content = f.read()

handle_publish_replacement = """  const handlePublish = async () => {
    if (platform === 'linkedin' && !linkedInConnected) {
      alert("Please connect LinkedIn first.");
      return;
    }
    
    setIsScheduling(true);
    
    setTimeout(() => {
      setIsScheduling(false);
      setIsPublished(true);
    }, 2000);
  };"""

content = re.sub(
    r"  const handlePublish = async \(\) => \{.*?\}, 2000\);\n  \};",
    handle_publish_replacement,
    content,
    flags=re.DOTALL
)

with open('src/pages/MarketingStudio.tsx', 'w') as f:
    f.write(content)
