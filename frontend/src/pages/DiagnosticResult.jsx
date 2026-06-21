import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Trophy,
  AlertTriangle,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import logo from "@/assets/logo.png";

const CATEGORY_LABELS = {
  web: "Presencia Web",
  crm: "CRM y Ventas",
  automation: "Automatización",
  ai: "IA y Atención",
  marketing: "Marketing Digital",
};

export default function DiagnosticResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/diagnostic/${id}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAFAFA]">
        <Loader2 className="animate-spin text-brand-orange" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAFAFA]">
        <div className="text-center">
          <p className="mb-4">No encontramos tu diagnóstico.</p>
          <Link to="/diagnostico">
            <Button>Reintentar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const maturity = data.maturity_score || 0;
  const recos = data.recommendations || [];
  const totalValue = recos.reduce((s, r) => s + (r.estimated_price || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="border-b border-black/5 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" data-testid="result-logo">
            <img src={logo} alt="Innovagraf" className="h-8 w-auto" />
          </Link>
          <Link to="/diagnostico">
            <Button variant="outline" className="rounded-full" data-testid="result-restart-button">
              Nuevo diagnóstico
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-6 mb-10">
          {/* Maturity Score */}
          <div className="lg:col-span-5 bg-brand-midnight text-white rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-brand-orange/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">
                Madurez digital
              </div>
              <div className="font-display text-7xl font-extrabold tracking-tighter mt-2" data-testid="result-maturity-score">
                {maturity}<span className="text-3xl text-white/50">/100</span>
              </div>
              <p className="mt-3 text-white/70 text-sm max-w-xs">
                Tu empresa, {data.company_name}, tiene oportunidades concretas para crecer.
              </p>
              <div className="mt-6 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ name: "score", value: maturity, fill: "#FF4F00" }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "rgba(255,255,255,0.08)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-black/5 p-8">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-2">
              Por área
            </div>
            <h2 className="font-display text-2xl font-bold mb-6">Puntaje por categoría</h2>
            <div className="space-y-4">
              {Object.entries(data.scores || {}).map(([k, v]) => (
                <div key={k} data-testid={`score-${k}`}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-semibold">{CATEGORY_LABELS[k] || k}</span>
                    <span className="text-xs font-bold text-brand-midnight">{v}/100</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-orange rounded-full transition-all"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-black/5">
              <div>
                <div className="text-xs uppercase tracking-wider text-brand-midnight/60">Inversión estimada</div>
                <div className="font-display text-2xl font-bold mt-1" data-testid="result-estimated-value">
                  {formatCurrency(totalValue)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-brand-midnight/60">Recomendaciones</div>
                <div className="font-display text-2xl font-bold mt-1">{recos.length} servicios</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {data.ai_summary && (
          <div className="bg-white rounded-3xl border border-black/5 p-8 mb-10">
            <div className="flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">
              <Sparkles size={14} /> Análisis IA personalizado
            </div>
            <div
              className="prose prose-sm max-w-none text-brand-midnight/85 whitespace-pre-line leading-relaxed"
              data-testid="result-ai-summary"
            >
              {data.ai_summary}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">Recomendaciones priorizadas</h2>
          <p className="text-brand-midnight/60 mt-1">Plan personalizado a partir de tus respuestas.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recos.map((r) => (
            <div
              key={r.service}
              className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-md hover:border-brand-orange/40 transition"
              data-testid={`reco-card-${r.service.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <PriorityBadge priority={r.priority} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{r.service}</h3>
              <p className="text-sm text-brand-midnight/70 leading-relaxed mb-4">{r.description}</p>
              <p className="text-xs text-brand-midnight/60 italic mb-4">{r.reason}</p>
              <div className="flex items-center justify-between pt-3 border-t border-black/5">
                <span className="text-xs text-brand-midnight/60">Inversión sugerida</span>
                <span className="font-display font-bold">{formatCurrency(r.estimated_price)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-brand-midnight text-white rounded-3xl p-10 grid md:grid-cols-2 gap-6 items-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-72 h-72 bg-brand-orange/30 rounded-full blur-3xl" />
          <div className="relative">
            <h3 className="font-display text-3xl font-bold tracking-tight">¿Listo para implementar tu plan?</h3>
            <p className="mt-3 text-white/70">
              Agenda una reunión con un consultor Innovagraf. Te entregaremos propuesta detallada en menos de 24 horas.
            </p>
          </div>
          <div className="relative flex md:justify-end gap-3 flex-wrap">
            <a
              href={`https://wa.me/50200000000?text=${encodeURIComponent(
                `Hola, completé el diagnóstico Innovagraf (${data.company_name}). Madurez ${maturity}/100.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="result-whatsapp-cta"
            >
              <Button className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-6 h-12">
                Hablar por WhatsApp <ArrowRight size={16} className="ml-1" />
              </Button>
            </a>
            <a href="mailto:contacto@innovagraf.com.gt" data-testid="result-email-cta">
              <Button variant="outline" className="rounded-full px-6 h-12 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                Escribir email
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    1: { label: "Prioridad alta", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
    2: { label: "Prioridad media", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Info },
    3: { label: "Sugerencia", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  };
  const m = map[priority] || map[3];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${m.cls}`}>
      <m.icon size={12} /> {m.label}
    </span>
  );
}
