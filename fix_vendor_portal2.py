import re

with open("src/pages/VendorPortal.tsx", "r") as f:
    content = f.read()

# Fix imports if needed? It already imports useAuth
content = content.replace(
"""  const [otpStep, setOtpStep] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");""",
""
)

# Replace OTP Check Method
old_otp_handler = """  // OTP Verification
  const handleOtpVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setOtpChecking(true);
    setTimeout(() => {
      setOtpChecking(false);
      if (otpCodeInput.trim() === generatedOtp || otpCodeInput.trim() === "123456") { // 123456 as backdoor for demo
        const match = vendors.find(v => 
          (v.vendorCode && v.vendorCode.toLowerCase() === vendorEmailInput.trim().toLowerCase()) || 
          (v.id && v.id.toLowerCase() === vendorEmailInput.trim().toLowerCase())
        );
        if (match) {
          toast.success(`Identity Verified. Welcome, ${match.name}`);
          setAuthenticatedVendor(match);
          sessionStorage.setItem("hn_vendor_code", match.vendorCode || match.id);
        }
      } else {
        toast.error("Invalid verification code");
      }
    }, 1000);
  };"""

content = content.replace(old_otp_handler, "")

with open("src/pages/VendorPortal.tsx", "w") as f:
    f.write(content)

