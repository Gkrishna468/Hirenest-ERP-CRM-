const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Add import
if (!content.includes('import ClientPortal')) {
    content = content.replace('import Login from "./pages/Login";', 'import Login from "./pages/Login";\nimport ClientPortal from "./pages/ClientPortal";');
}

// Add ClientRoute
if (!content.includes('function ClientRoute')) {
    content = content.replace('export default function App() {', `
function ClientRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-medium">Loading Client Portal...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {`);
}

// Add Route
if (!content.includes('path="/client"')) {
    content = content.replace('<Route path="*" element={<Navigate to="/" />} />', `
              <Route
                path="/client"
                element={
                  <ClientRoute>
                    <ClientPortal />
                  </ClientRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />`);
}

fs.writeFileSync(appPath, content);
