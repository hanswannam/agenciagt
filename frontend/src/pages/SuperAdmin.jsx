import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Crown,
  ShieldAlert,
  Trash2,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/constants";

const PLAN_BADGE = {
  starter: "bg-zinc-100 text-zinc-700 border-zinc-300",
  pro: "bg-amber-50 text-amber-700 border-amber-300",
  enterprise: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

export default function SuperAdmin() {
  const [overview, setOverview] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [o, w] = await Promise.all([
        api.get("/super-admin/overview"),
        api.get("/super-admin/workspaces"),
      ]);
      setOverview(o.data);
      setWorkspaces(w.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateWorkspace = async (id, patch) => {
    try {
      await api.patch(`/super-admin/workspaces/${id}`, patch);
      toast.success("Workspace actualizado");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Error al actualizar");
    }
  };

  const removeWorkspace = async (id) => {
    try {
      await api.delete(`/super-admin/workspaces/${id}`);
      toast.success("Workspace eliminado");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Error al eliminar");
    }
  };

  if (loading || !overview) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando panel super-admin…</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between" data-testid="super-admin-page">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold inline-flex items-center gap-1">
            <Crown size={14} /> Super-Admin · Plataforma
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Innovagraf Platform</h1>
          <p className="text-sm text-brand-midnight/60">Control global de todos los workspaces.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Workspaces" value={overview.total_workspaces} sub={`${overview.active_workspaces} activos · ${overview.suspended_workspaces} suspendidos`} icon={Building2} testId="stat-workspaces" />
        <Stat label="Usuarios" value={overview.total_users} sub="en toda la plataforma" icon={Users} testId="stat-users" />
        <Stat label="Leads" value={overview.total_leads} sub={`${overview.total_proposals} propuestas creadas`} icon={TrendingUp} testId="stat-leads" />
        <Stat label="Ganado total" value={formatCurrency(overview.total_won_value)} sub="valor cerrado" icon={Sparkles} testId="stat-won" />
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55">Distribución de planes</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["starter", "pro", "enterprise"].map((p) => (
            <div key={p} className="px-4 py-3 rounded-xl border border-black/10" data-testid={`plan-dist-${p}`}>
              <div className="text-xs uppercase tracking-wider text-brand-midnight/55 capitalize">{p}</div>
              <div className="font-display font-bold text-2xl mt-1">{overview.plan_distribution[p] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5">
        <div className="p-4 border-b border-black/5 font-semibold">Todos los workspaces</div>
        <table className="w-full text-sm" data-testid="workspaces-table">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <Th>Workspace</Th>
              <Th>Slug</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Leads (mes/total)</Th>
              <Th>Usuarios</Th>
              <Th>Creado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id} className="border-t border-black/5" data-testid={`workspace-row-${w.id}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{w.name}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-brand-midnight/65">/{w.slug}</td>
                <td className="px-4 py-3">
                  <Select value={w.plan} onValueChange={(v) => updateWorkspace(w.id, { plan: v })}>
                    <SelectTrigger className="w-32 h-8" data-testid={`plan-select-${w.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">starter</SelectItem>
                      <SelectItem value="pro">pro</SelectItem>
                      <SelectItem value="enterprise">enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[w.plan] || PLAN_BADGE.starter}`}>
                    {w.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(w.status || "active") === "active"}
                      onCheckedChange={(on) => updateWorkspace(w.id, { status: on ? "active" : "suspended" })}
                      data-testid={`status-switch-${w.id}`}
                    />
                    <span className="text-xs text-brand-midnight/65">{w.status === "suspended" ? "Suspendido" : "Activo"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{w.stats.leads_this_month}</span>
                  <span className="text-brand-midnight/55"> / {w.stats.leads_total}</span>
                </td>
                <td className="px-4 py-3">{w.stats.users}</td>
                <td className="px-4 py-3 text-brand-midnight/60">{formatDate(w.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"
                    onClick={() => setDeleting(w)}
                    data-testid={`delete-workspace-${w.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent data-testid="delete-workspace-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert size={20} /> Eliminar workspace
            </DialogTitle>
          </DialogHeader>
          {deleting && (
            <div className="space-y-3 text-sm">
              <p>
                Vas a eliminar <strong>{deleting.name}</strong> y TODOS sus datos:
                {" "}{deleting.stats.leads_total} leads, {deleting.stats.users} usuarios,
                {" "}{deleting.stats.proposals} propuestas. Esta acción es irreversible.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="rounded-full">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => removeWorkspace(deleting.id)}
              data-testid="confirm-delete-workspace"
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, testId }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55">{label}</div>
        <div className="w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
          <Icon size={18} />
        </div>
      </div>
      <div className="font-display text-3xl font-bold mt-3">{value}</div>
      <div className="text-xs text-brand-midnight/55 mt-1">{sub}</div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-brand-midnight/55">{children}</th>;
}
