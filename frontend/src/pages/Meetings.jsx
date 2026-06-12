import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/constants";
import { Calendar } from "lucide-react";

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    api.get("/meetings").then((r) => setMeetings(r.data));
  }, []);

  const grouped = meetings.reduce((acc, m) => {
    const key = (m.scheduled_at || "").slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(m);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="p-8">
      <header className="mb-6">
        <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">Agenda</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reuniones</h1>
        <p className="text-sm text-brand-midnight/60">Próximas reuniones y compromisos con leads.</p>
      </header>

      {sortedDays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center" data-testid="meetings-empty">
          <Calendar size={32} className="mx-auto mb-3 text-brand-midnight/30" />
          <p className="text-sm text-brand-midnight/60">Aún no hay reuniones agendadas.</p>
          <p className="text-xs text-brand-midnight/50 mt-2">Crea una reunión desde el detalle de un lead.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <div key={day} data-testid={`day-${day}`}>
              <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/60 mb-2">
                {new Date(day).toLocaleDateString("es-GT", { weekday: "long", day: "2-digit", month: "long" })}
              </div>
              <div className="bg-white rounded-2xl border border-black/5 divide-y divide-black/5">
                {grouped[day].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).map((m) => (
                  <Link to={`/app/leads/${m.lead_id}`} key={m.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition" data-testid={`meeting-row-${m.id}`}>
                    <div className="w-16 text-center">
                      <div className="font-display font-bold text-2xl text-brand-orange">
                        {new Date(m.scheduled_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-brand-midnight/50">{m.duration_min} min</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-xs text-brand-midnight/55">{m.location}</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-zinc-100">{m.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
