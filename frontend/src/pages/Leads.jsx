import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, STATUS_COLORS, STATUSES, formatCurrency, formatDate } from "@/lib/constants";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/errors";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const load = async () => {
    const params = statusFilter !== "all" ? { status: statusFilter } : {};
    const { data } = await api.get("/leads", { params });
    setLeads(data);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filtered = leads.filter((l) => {
    const s = search.toLowerCase();
    return (
      !s ||
      l.company_name?.toLowerCase().includes(s) ||
      l.contact_name?.toLowerCase().includes(s) ||
      l.contact_email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">CRM</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Leads</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full" data-testid="open-create-lead">
              <Plus size={16} className="mr-1" /> Nuevo lead
            </Button>
          </DialogTrigger>
          <CreateLeadDialog onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </header>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-midnight/40" />
          <Input
            placeholder="Buscar por empresa, contacto o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="leads-search-input"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56" data-testid="leads-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm" data-testid="leads-table">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <Th>Empresa</Th>
              <Th>Contacto</Th>
              <Th>Estado</Th>
              <Th>Valor estimado</Th>
              <Th>Madurez</Th>
              <Th>Creado</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-brand-midnight/55">Sin leads.</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} className="border-t border-black/5 hover:bg-zinc-50/60 transition" data-testid={`lead-row-${l.id}`}>
                <td className="px-4 py-3">
                  <Link to={`/app/leads/${l.id}`} className="font-semibold hover:text-brand-orange">
                    {l.company_name}
                  </Link>
                  <div className="text-xs text-brand-midnight/55">{l.industry || ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{l.contact_name}</div>
                  <div className="text-xs text-brand-midnight/55">{l.contact_email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[l.status]}`}>
                    {STATUS_LABELS[l.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(l.estimated_value)}</td>
                <td className="px-4 py-3">{l.maturity_score || 0}</td>
                <td className="px-4 py-3 text-brand-midnight/60">{formatDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-brand-midnight/55">
      {children}
    </th>
  );
}

function CreateLeadDialog({ onSaved }) {
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    industry: "",
    status: "nuevo",
    estimated_value: 0,
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.company_name || !form.contact_name || !form.contact_email) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setLoading(true);
    try {
      await api.post("/leads", form);
      toast.success("Lead creado");
      onSaved();
    } catch (e) {
      handleApiError(e, "Error al crear lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent data-testid="create-lead-dialog">
      <DialogHeader>
        <DialogTitle>Crear nuevo lead</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Empresa *">
          <Input data-testid="new-lead-company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </Field>
        <Field label="Industria">
          <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        </Field>
        <Field label="Contacto *">
          <Input data-testid="new-lead-contact" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        </Field>
        <Field label="Email *">
          <Input data-testid="new-lead-email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </Field>
        <Field label="Teléfono">
          <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </Field>
        <Field label="Valor estimado USD">
          <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: parseFloat(e.target.value) || 0 })} />
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={loading} className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="save-new-lead">
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wider font-bold">{label}</Label>
      {children}
    </div>
  );
}
