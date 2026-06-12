import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings2,
  LogOut,
  Sparkles,
  Trello,
} from "lucide-react";

const links = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/app/crm", label: "CRM Kanban", icon: Trello, testId: "nav-crm" },
  { to: "/app/leads", label: "Leads", icon: Users, testId: "nav-leads" },
  { to: "/app/meetings", label: "Agenda", icon: Calendar, testId: "nav-meetings" },
  { to: "/app/proposals", label: "Propuestas", icon: FileText, testId: "nav-proposals" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <aside className="fixed inset-y-0 left-0 w-64 bg-brand-midnight text-white flex flex-col z-20">
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2" data-testid="sidebar-logo">
            <div className="w-9 h-9 rounded-lg bg-brand-orange flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-display font-bold leading-tight">Innovagraf</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-white/60">Growth System</div>
            </div>
          </Link>
          {user?.workspace && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10" data-testid="sidebar-workspace">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Workspace</div>
              <div className="text-sm font-semibold truncate">{user.workspace.name}</div>
              <div className="text-[10px] text-brand-orange font-mono truncate">/diagnostico/w/{user.workspace.slug}</div>
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.testId}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-orange text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/app/admin"
              data-testid="nav-admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-orange text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Settings2 size={18} />
              Administración
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-semibold truncate" data-testid="sidebar-user-name">
              {user?.name}
            </div>
            <div className="text-xs text-white/60 capitalize" data-testid="sidebar-user-role">
              {user?.role}
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            data-testid="logout-button"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
