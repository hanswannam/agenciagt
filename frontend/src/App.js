import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Diagnostic from "@/pages/Diagnostic";
import DiagnosticResult from "@/pages/DiagnosticResult";
import Login from "@/pages/Login";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import CRMKanban from "@/pages/CRMKanban";
import Leads from "@/pages/Leads";
import LeadDetail from "@/pages/LeadDetail";
import Meetings from "@/pages/Meetings";
import Proposals from "@/pages/Proposals";
import ProposalEditor from "@/pages/ProposalEditor";
import Admin from "@/pages/Admin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/diagnostico" element={<Diagnostic />} />
          <Route path="/diagnostico/resultado/:id" element={<DiagnosticResult />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="crm" element={<CRMKanban />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="proposals" element={<Proposals />} />
            <Route path="proposals/:id" element={<ProposalEditor />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
