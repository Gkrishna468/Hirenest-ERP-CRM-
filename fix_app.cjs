const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/App.tsx');
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('import VendorPortal from "./pages/VendorPortal";')) {
  c = c.replace(
    'import VendorSubmit from "./pages/VendorSubmit";',
    'import VendorSubmit from "./pages/VendorSubmit";\nimport VendorPortal from "./pages/VendorPortal";'
  );
}

const vendorRouteStr = `function VendorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-medium">Loading Delivery OS...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}`;

if (!c.includes('function VendorRoute')) {
  c = c.replace('function ClientRoute', vendorRouteStr + '\n\nfunction ClientRoute');
}

const vendorRouteEntry = `              <Route
                path="/vendor"
                element={
                  <VendorRoute>
                    <VendorPortal />
                  </VendorRoute>
                }
              />`;

if (!c.includes('<Route path="/vendor"')) {
  c = c.replace('<Route path="*" element={<Navigate to="/" />} />', vendorRouteEntry + '\n              <Route path="*" element={<Navigate to="/" />} />');
}

fs.writeFileSync(p, c);
