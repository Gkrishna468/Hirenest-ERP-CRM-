import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

# Add icons
content = content.replace(
    """import { Plus, Search, Building2, MapPin, Users, Filter, Clock, Banknote, FileText, ChevronRight, Share2, BriefcaseIcon, DollarSign, Activity, Settings2, Globe, MessageCircle, Linkedin, XCircle, Zap, Eye, Download, CheckCircle, X, ExternalLink } from "lucide-react";""",
    """import { Plus, Search, Building2, MapPin, Users, Filter, Clock, Banknote, FileText, ChevronRight, Share2, BriefcaseIcon, DollarSign, Activity, Settings2, Globe, MessageCircle, Linkedin, XCircle, Zap, Eye, Download, CheckCircle, CheckCircle2, RefreshCw, X, ExternalLink } from "lucide-react";"""
)

content = content.replace("refreshData();", "window.location.reload();")

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

