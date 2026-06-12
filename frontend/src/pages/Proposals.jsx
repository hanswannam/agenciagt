import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/constants";
import { FileText, Sparkles } from "lucide-react";

const STATUS = {
  draft: { label: "Borrador", cls: "bg-zinc-100 text-zinc-700" },
  sent: { label: "Enviada", cls: "bg-amber-100 text-amber-700" },
  accepted: { label: "Aceptada", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rechazada", cls: "bg-rose-100 text-rose-700" },
};

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [leads, setLeads] = useState({});

  useEffect(() => {
    (async () => {
      const [p, l] = await Promise.all([
        api.get("/proposals"),
        api.get("/leads"),
      ]);
      setProposals(p.data);
      const map = {};
      for (const lead of l.data) map[lead.id] = lead;
      setLeads(map);
    })();
  }, []);

  return (
    <div className="p-8">
      <header className="mb-6">
        <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">Comercial</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Propuestas</h1>
        <p className="text-sm text-brand-midnight/60">Todas las propuestas generadas para tus leads.</p>
      </header>

      {proposals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center" data-testid="proposals-empty">
          <FileText size={32} className="mx-auto mb-3 text-brand-midnight/30" />
          <p className="text-sm text-brand-midnight/60">Aún no hay propuestas creadas.</p>
          <p className="text-xs text-brand-midnight/50 mt-2">Genera una desde el detalle de un lead.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map((p) => {
            const s = STATUS[p.status] || STATUS.draft;
            const lead = leads[p.lead_id];
            return (
              <Link
                to={`/app/proposals/${p.id}`}
                key={p.id}
                className="bg-white rounded-2xl border border-black/10 p-6 hover:border-brand-orange/40 hover:shadow-md transition"
                data-testid={`proposal-card-${p.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                  {p.generated_by_ai && (
                    <span className="text-xs text-brand-orange inline-flex items-center gap-1">
                      <Sparkles size={12} /> IA
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-lg leading-tight line-clamp-2">{p.title}</h3>
                {lead && (
                  <div className="text-xs text-brand-midnight/55 mt-1">{lead.company_name}</div>
                )}
                <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-baseline">
                  <span className="text-xs text-brand-midnight/55">{formatDate(p.created_at)}</span>
                  <span className="font-display font-bold text-xl text-brand-orange">
                    {formatCurrency(p.total, p.currency)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
