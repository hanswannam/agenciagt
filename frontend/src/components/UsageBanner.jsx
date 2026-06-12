import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const PLAN_NAMES = { starter: "Starter (Gratis)", pro: "Pro", enterprise: "Enterprise" };

export default function UsageBanner() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get("/workspaces/usage").then((r) => setUsage(r.data)).catch(() => {});
  }, []);

  if (!usage) return null;
  const { workspace, limits, usage: u } = usage;
  const leadsCap = limits.leads_per_month;
  const usersCap = limits.users;

  if (workspace.plan === "enterprise") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3" data-testid="usage-banner-enterprise">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-emerald-800">Plan Enterprise activo</div>
          <div className="text-xs text-emerald-700/80">Sin límites de leads, usuarios ni funciones IA.</div>
        </div>
      </div>
    );
  }

  const leadsPct = leadsCap ? Math.min(100, (u.leads_this_month / leadsCap) * 100) : 0;
  const usersPct = usersCap ? Math.min(100, (u.users / usersCap) * 100) : 0;
  const nearLimit = leadsPct >= 80 || usersPct >= 80;

  return (
    <div
      className={`rounded-2xl p-5 border ${nearLimit ? "bg-amber-50 border-amber-200" : "bg-white border-black/5"}`}
      data-testid="usage-banner"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {nearLimit && <AlertTriangle size={16} className="text-amber-600" />}
          <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/65">
            Plan {PLAN_NAMES[workspace.plan] || workspace.plan}
          </div>
        </div>
        <Link
          to="/app/admin"
          className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
          data-testid="upgrade-link"
        >
          <Sparkles size={12} /> Upgrade a Pro
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Bar
          label="Leads este mes"
          used={u.leads_this_month}
          cap={leadsCap}
          pct={leadsPct}
          testId="usage-leads"
        />
        <Bar
          label="Usuarios"
          used={u.users}
          cap={usersCap}
          pct={usersPct}
          testId="usage-users"
        />
      </div>
      {nearLimit && (
        <div className="text-xs text-amber-800 mt-3">
          Estás cerca del límite. Considera actualizar a Pro para no perder leads ni capacidad.
        </div>
      )}
    </div>
  );
}

function Bar({ label, used, cap, pct, testId }) {
  return (
    <div data-testid={testId}>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-brand-midnight/65 font-semibold">{label}</span>
        <span className="text-xs font-bold text-brand-midnight">
          {used} <span className="text-brand-midnight/55">/ {cap ?? "∞"}</span>
        </span>
      </div>
      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-brand-orange"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
