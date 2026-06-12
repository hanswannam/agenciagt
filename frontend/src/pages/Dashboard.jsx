import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import UsageBanner from "@/components/UsageBanner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { STATUS_LABELS, formatCurrency } from "@/lib/constants";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/dashboard/overview").then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>;

  const kpis = [
    {
      label: "Leads captados",
      value: data.total_leads,
      icon: Users,
      sub: `${data.won_count} ganados · ${data.lost_count} perdidos`,
      testId: "kpi-total-leads",
    },
    {
      label: "Conversión",
      value: `${data.conversion_rate}%`,
      icon: TrendingUp,
      sub: "de cierres ganados",
      testId: "kpi-conversion",
    },
    {
      label: "Pipeline activo",
      value: formatCurrency(data.pipeline_value),
      icon: DollarSign,
      sub: `Ganado: ${formatCurrency(data.won_value)}`,
      testId: "kpi-pipeline",
    },
    {
      label: "Madurez promedio",
      value: `${data.avg_maturity_score}/100`,
      icon: Target,
      sub: "score digital",
      testId: "kpi-maturity",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between" data-testid="dashboard-page">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">
            Panel ejecutivo
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link
          to="/app/crm"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:underline"
          data-testid="dashboard-to-crm"
        >
          Ir al CRM <ArrowUpRight size={14} />
        </Link>
      </header>

      <UsageBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl border border-black/5 p-6"
            data-testid={k.testId}
          >
            <div className="flex items-start justify-between">
              <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55">
                {k.label}
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                <k.icon size={18} />
              </div>
            </div>
            <div className="font-display text-3xl font-bold mt-3">{k.value}</div>
            <div className="text-xs text-brand-midnight/55 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Funnel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-black/5 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55">
                Embudo comercial
              </div>
              <div className="font-display text-lg font-bold">Distribución de leads por estado</div>
            </div>
          </div>
          <div className="space-y-2">
            {data.funnel.map((f) => {
              const max = Math.max(...data.funnel.map((x) => x.count), 1);
              const pct = (f.count / max) * 100;
              return (
                <div key={f.status} data-testid={`funnel-${f.status}`}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-semibold">{STATUS_LABELS[f.status]}</span>
                    <span className="text-xs font-bold text-brand-midnight">{f.count}</span>
                  </div>
                  <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-orange to-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-black/5 p-6">
          <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55">
            Leads por mes
          </div>
          <div className="font-display text-lg font-bold mb-4">Últimos 6 meses</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.leads_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#FF4F00" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55">
              Demanda de servicios
            </div>
            <div className="font-display text-lg font-bold">Servicios más solicitados</div>
          </div>
          <Sparkles size={16} className="text-brand-orange" />
        </div>
        {data.services_demand.length === 0 ? (
          <p className="text-sm text-brand-midnight/55 py-8 text-center">
            Aún no hay servicios solicitados.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.services_demand} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="service" type="category" stroke="#94a3b8" fontSize={12} width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF4F00" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
