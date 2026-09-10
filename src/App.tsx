import "./lib/ai/RufloOrchestrator";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { Sidebar } from "./components/Sidebar";
import { MobileNavBar } from "./components/MobileNavBar";
import { Toaster } from "sonner";
import { ProductionIntegrityCheck } from "./components/ProductionIntegrityCheck";

// Pages
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspaces";
import Accounts from "./pages/Accounts";
import Contacts from "./pages/Contacts";
import Requirements from "./pages/Requirements";
import Candidates from "./pages/Candidates";
import Vendors from "./pages/Vendors";
import Revenue from "./pages/Revenue";
import CommunicationCenter from "./pages/CommunicationCenter";
import Settings from "./pages/Settings";
import MarketingStudio from "./pages/MarketingStudio";
import AutomationStudio from "./pages/AutomationStudio";
import Login from "./pages/Login";
import ClientPortal from "./pages/ClientPortal";
import PublicApply from "./pages/PublicApply";
import VendorSubmit from "./pages/VendorSubmit";
import VendorPortal from "./pages/VendorPortal";
import AIAccuracy from "./pages/AIAccuracy";
import QualityControl from "./pages/QualityControl";
import Agents from "./pages/Agents";
import AIControlCenter from "./pages/AIControlCenter";
import KnowledgeVault from "./pages/KnowledgeVault";
import HROperations from "./pages/HROperations";
import TwentyCRM from "./pages/TwentyCRM";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-medium">
        Loading HireNest...
      </div>
    );
  if (!user) return <Navigate to="/login" />;

  // Redirect vendors away from internal CRM routes
  if (user.role === "vendor") {
    return <Navigate to="/vendor" />;
  }

  return (
    <div className="flex h-screen skeuo-container flex-row overflow-hidden">
      <div className="shrink-0 h-full overflow-y-auto w-64 border-r border-slate-300">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto h-full">
        <div className="w-full min-h-full p-4 md:p-8">{children}</div>
      </main>
      {/* <MobileNavBar /> */}
    </div>
  );
}


function VendorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-medium">Loading Delivery OS...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-medium">Loading Client Portal...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ProductionIntegrityCheck>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/apply/:jobId" element={<PublicApply />} />
              <Route path="/vendor-submit/:jobId" element={<VendorSubmit />} />
              <Route path="/vendor-submit" element={<VendorSubmit />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/workspaces"
                element={
                  <PrivateRoute>
                    <Workspaces />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ai-control"
                element={
                  <PrivateRoute>
                    <AIControlCenter />
                  </PrivateRoute>
                }
              />
              <Route
                path="/agents"
                element={
                  <PrivateRoute>
                    <Agents />
                  </PrivateRoute>
                }
              />
              <Route
                path="/knowledge-vault"
                element={
                  <PrivateRoute>
                    <KnowledgeVault />
                  </PrivateRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <PrivateRoute>
                    <Accounts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <PrivateRoute>
                    <Contacts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/requirements"
                element={
                  <PrivateRoute>
                    <Requirements />
                  </PrivateRoute>
                }
              />

              {/* New Staffing Routes */}
              <Route
                path="/candidates"
                element={
                  <PrivateRoute>
                    <Candidates />
                  </PrivateRoute>
                }
              />
              <Route
                path="/submissions"
                element={
                  <PrivateRoute>
                    <Candidates />
                  </PrivateRoute>
                }
              />
              <Route
                path="/interviews"
                element={
                  <PrivateRoute>
                    <Candidates />
                  </PrivateRoute>
                }
              />
              <Route
                path="/offers"
                element={
                  <PrivateRoute>
                    <Candidates />
                  </PrivateRoute>
                }
              />
              <Route
                path="/placements"
                element={
                  <PrivateRoute>
                    <Candidates />
                  </PrivateRoute>
                }
              />

              <Route
                path="/vendors"
                element={
                  <PrivateRoute>
                    <Vendors />
                  </PrivateRoute>
                }
              />

              <Route
                path="/marketing"
                element={
                  <PrivateRoute>
                    <MarketingStudio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/revenue"
                element={
                  <PrivateRoute>
                    <Revenue />
                  </PrivateRoute>
                }
              />

              <Route
                path="/mail"
                element={
                  <PrivateRoute>
                    <CommunicationCenter />
                  </PrivateRoute>
                }
              />

              <Route
                path="/ai-accuracy"
                element={
                  <PrivateRoute>
                    <AIAccuracy />
                  </PrivateRoute>
                }
              />
              <Route
                path="/quality-control"
                element={
                  <PrivateRoute>
                    <QualityControl />
                  </PrivateRoute>
                }
              />
              <Route
                path="/hr"
                element={
                  <PrivateRoute>
                    <HROperations />
                  </PrivateRoute>
                }
              />
              <Route
                path="/twenty-crm"
                element={
                  <PrivateRoute>
                    <TwentyCRM />
                  </PrivateRoute>
                }
              />

              <Route
                path="/automation"
                element={
                  <PrivateRoute>
                    <AutomationStudio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/client"
                element={
                  <ClientRoute>
                    <ClientPortal />
                  </ClientRoute>
                }
              />
                            <Route
                path="/vendor"
                element={
                  <VendorRoute>
                    <VendorPortal />
                  </VendorRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </Router>
        </ProductionIntegrityCheck>
      </DataProvider>
    </AuthProvider>
  );
}
