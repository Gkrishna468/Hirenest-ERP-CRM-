import re

with open('src/pages/MarketingStudio.tsx', 'r') as f:
    content = f.read()

handle_publish_replacement = """  const handlePublish = async () => {
    if (platform === 'linkedin' && !linkedInConnected) {
      alert("Please connect LinkedIn first.");
      return;
    }
    
    setIsScheduling(true);
    
    if (platform === 'email') {
      try {
        const { user } = useAuth();
        await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            to: 'vendors@hirenestworkforce.com',
            subject: 'Automated Campaign',
            body: generatedContent
          })
        });
      } catch (e) {
        console.error("Email seq err", e);
      }
    }
    
    setTimeout(() => {
      setIsScheduling(false);
      setIsPublished(true);
    }, 2000);
  };"""

content = re.sub(
    r"  const handlePublish = \(\) => \{.*?\}, 2000\);\n  \};",
    handle_publish_replacement,
    content,
    flags=re.DOTALL
)

with open('src/pages/MarketingStudio.tsx', 'w') as f:
    f.write(content)
