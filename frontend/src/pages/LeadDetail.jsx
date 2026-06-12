import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarPlus,
  FileText,
  Loader2,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  SERVICES,
  formatCurrency,
  formatDateTime,
} from "@/lib/constants";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [note, setNote] = useState("");
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);

  const load = async () => {
    const [l, m, p] = await Promise.all([
      api.get(`/leads/${id}`),
      api.get("/meetings", { params: { lead_id: id } }),
      api.get("/proposals", { params: { lead_id: id } }),
    ]);
    setLead(l.data);
    setMeetings(m.data);
    setProposals(p.data);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (!lead) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>;

  const changeStatus = async (s) => {
    await api.patch(`/leads/${id}`, { status: s });
    toast.success("Estado actualizado");
    load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await api.post(`/leads/${id}/notes`, { text: note });
    setNote("");
    toast.success("Nota agregada");
    load();
  };

  return (
    <div className="p-8 max-w-6xl">
      <button onClick={() => navigate("/app/leads")} className="text-sm text-brand-midnight/60 hover:text-brand-orange inline-flex items-center gap-1 mb-4" data-testid="lead-back">
        <ArrowLeft size={14} /> Volver a leads
      </button>

      <div className="bg-white rounded-2xl border border-black/5 p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-orange font-bold">
              {lead.industry || "Lead"}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mt-1" data-testid="lead-company-name">
              {lead.company_name}
            </h1>
            <div className="text-sm text-brand-midnight/65 mt-1">
              {lead.contact_name} · {lead.contact_email}
              {lead.contact_phone ? ` · ${lead.contact_phone}` : ""}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Select value={lead.status} onValueChange={changeStatus}>
              <SelectTrigger className="w-56" data-testid="lead-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[lead.status]}`}>
              {STATUS_LABELS[lead.status]}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-black/5">
          <Kpi label="Valor estimado" value={formatCurrency(lead.estimated_value)} />
          <Kpi label="Madurez digital" value={`${lead.maturity_score || 0}/100`} />
          <Kpi label="Servicios" value={(lead.requested_services || []).length} />
          <Kpi label="Origen" value={lead.source} />
        </div>
        {(lead.requested_services || []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {lead.requested_services.map((s) => (
              <span key={s} className="text-xs px-2 py-1 rounded-full bg-brand-orange/10 text-brand-orange font-semibold">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full" data-testid="schedule-meeting-button">
                <CalendarPlus size={16} className="mr-1" /> Agendar reunión
              </Button>
            </DialogTrigger>
            <CreateMeetingDialog leadId={id} onSaved={() => { setMeetingOpen(false); load(); }} />
          </Dialog>

          <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full" data-testid="generate-proposal-button">
                <Sparkles size={16} className="mr-1" /> Generar propuesta IA
              </Button>
            </DialogTrigger>
            <GenerateProposalDialog leadId={id} defaultServices={lead.requested_services || []} onSaved={(pid) => { setProposalOpen(false); navigate(`/app/proposals/${pid}`); }} />
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity" data-testid="tab-activity">Actividad</TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">Notas</TabsTrigger>
          <TabsTrigger value="meetings" data-testid="tab-meetings">Reuniones ({meetings.length})</TabsTrigger>
          <TabsTrigger value="proposals" data-testid="tab-proposals">Propuestas ({proposals.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <div className="bg-white rounded-2xl border border-black/5 p-6">
            {(lead.activities || []).length === 0 ? (
              <p className="text-sm text-brand-midnight/55">Sin actividad aún.</p>
            ) : (
              <ul className="space-y-3">
                {lead.activities.slice().reverse().map((a) => (
                  <li key={a.id} className="flex gap-3" data-testid={`activity-${a.id}`}>
                    <div className="w-2 h-2 rounded-full bg-brand-orange mt-2" />
                    <div>
                      <div className="text-sm">{a.description}</div>
                      <div className="text-xs text-brand-midnight/55">{formatDateTime(a.created_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <div className="bg-white rounded-2xl border border-black/5 p-6">
            <Textarea
              placeholder="Escribe una nota interna…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="note-textarea"
            />
            <Button onClick={addNote} className="mt-2 rounded-full bg-brand-orange hover:bg-brand-orangeDark text-white" data-testid="add-note-button">
              <StickyNote size={14} className="mr-1" /> Agregar nota
            </Button>
            <div className="mt-6 space-y-3">
              {(lead.notes || []).slice().reverse().map((n) => (
                <div key={n.id} className="border-l-2 border-brand-orange pl-3" data-testid={`note-${n.id}`}>
                  <div className="text-sm">{n.text}</div>
                  <div className="text-xs text-brand-midnight/55">{n.author_name} · {formatDateTime(n.created_at)}</div>
                </div>
              ))}
              {(lead.notes || []).length === 0 && (
                <p className="text-sm text-brand-midnight/55">Aún no hay notas.</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="meetings">
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-3">
            {meetings.length === 0 ? <p className="text-sm text-brand-midnight/55">Sin reuniones aún.</p> :
              meetings.map((m) => (
                <div key={m.id} className="flex justify-between border-b border-black/5 pb-3 last:border-0" data-testid={`meeting-${m.id}`}>
                  <div>
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-xs text-brand-midnight/55">{formatDateTime(m.scheduled_at)} · {m.duration_min} min · {m.location}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-zinc-100">{m.status}</span>
                </div>
              ))
            }
          </div>
        </TabsContent>
        <TabsContent value="proposals">
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-3">
            {proposals.length === 0 ? <p className="text-sm text-brand-midnight/55">Aún no hay propuestas para este lead.</p> :
              proposals.map((p) => (
                <Link key={p.id} to={`/app/proposals/${p.id}`} className="flex justify-between border-b border-black/5 pb-3 last:border-0 hover:bg-zinc-50 rounded-lg px-2 -mx-2" data-testid={`proposal-${p.id}`}>
                  <div>
                    <div className="font-semibold flex items-center gap-2"><FileText size={14} /> {p.title}</div>
                    <div className="text-xs text-brand-midnight/55">{formatCurrency(p.total)} · {p.status}</div>
                  </div>
                </Link>
              ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-brand-midnight/55 font-bold">{label}</div>
      <div className="font-display text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function CreateMeetingDialog({ leadId, onSaved }) {
  const [form, setForm] = useState({
    title: "Reunión de descubrimiento",
    description: "",
    scheduled_at: "",
    duration_min: 30,
    location: "Google Meet",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.scheduled_at) {
      toast.error("Selecciona fecha y hora");
      return;
    }
    setLoading(true);
    try {
      await api.post("/meetings", { ...form, lead_id: leadId, scheduled_at: new Date(form.scheduled_at).toISOString() });
      toast.success("Reunión agendada");
      onSaved();
    } catch (e) {
      toast.error("Error al agendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent data-testid="create-meeting-dialog">
      <DialogHeader>
        <DialogTitle>Agendar reunión</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Título</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fecha y hora</Label>
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} data-testid="meeting-datetime" />
          </div>
          <div>
            <Label>Duración (min)</Label>
            <Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value || "30") })} />
          </div>
        </div>
        <div>
          <Label>Ubicación</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <Label>Descripción</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={loading} className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="save-meeting">
          {loading ? <Loader2 className="animate-spin" /> : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function GenerateProposalDialog({ leadId, defaultServices, onSaved }) {
  const [services, setServices] = useState(defaultServices.length ? defaultServices : ["Página Web"]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (s) => setServices((arr) => arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]);

  const generate = async () => {
    if (services.length === 0) {
      toast.error("Selecciona al menos un servicio");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/proposals/generate", { lead_id: leadId, services, notes });
      toast.success("Propuesta generada");
      onSaved(data.id);
    } catch (e) {
      toast.error("Error al generar propuesta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent data-testid="generate-proposal-dialog">
      <DialogHeader>
        <DialogTitle>Generar propuesta con IA</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold">Servicios a incluir</Label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SERVICES.map((s) => {
              const on = services.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  data-testid={`proposal-service-${s.replace(/\s+/g, "-")}`}
                  className={`text-xs px-3 py-1.5 rounded-full border ${on ? "bg-brand-orange text-white border-brand-orange" : "bg-white border-black/15 hover:border-brand-orange/50"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <Label>Notas adicionales (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. cliente quiere lanzamiento en 60 días…" data-testid="proposal-notes" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={generate} disabled={loading} className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="run-generate-proposal">
          {loading ? <><Loader2 className="animate-spin mr-2" size={14} /> Generando…</> : <><Sparkles size={14} className="mr-2" /> Generar</>}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
