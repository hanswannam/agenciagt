import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (superAdminOnly && user.role !== "super_admin") return <Navigate to="/app/dashboard" replace />;
  if (adminOnly && !["admin", "super_admin"].includes(user.role)) return <Navigate to="/app/dashboard" replace />;
  return children;
}
