import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, API } from "@/lib/api";
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
import { ArrowLeft, Download, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/errors";
import { formatCurrency } from "@/lib/constants";

export default function ProposalEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/proposals/${id}`).then((r) => setP(r.data));
  }, [id]);

  if (!p) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>;

  const updateItem = (idx, field, value) => {
    const items = [...p.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      items[idx].total = (items[idx].quantity || 0) * (items[idx].unit_price || 0);
    }
    setP({ ...p, items });
  };

  const addItem = () => setP({ ...p, items: [...p.items, { name: "", description: "", quantity: 1, unit_price: 0, total: 0 }] });
  const removeItem = (idx) => setP({ ...p, items: p.items.filter((_, i) => i !== idx) });

  const save = async (newStatus) => {
    setSaving(true);
    try {
      const payload = {
        title: p.title,
        summary: p.summary,
        scope: p.scope,
        objectives: p.objectives,
        items: p.items,
        phases: p.phases,
      };
      if (newStatus) payload.status = newStatus;
      const { data } = await api.patch(`/proposals/${id}`, payload);
      setP(data);
      toast.success(newStatus ? "Propuesta enviada" : "Cambios guardados");
    } catch (e) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const token = localStorage.getItem("innovagraf_token");
      const res = await fetch(`${API}/proposals/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 402) {
        const body = await res.json();
        toast.error("Upgrade requerido", {
          description: body?.detail || "Exportar a PDF requiere plan Pro o Enterprise.",
          duration: 6000,
        });
        return;
      }
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `propuesta-${p.title.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("No se pudo descargar el PDF");
    }
  };

  const subtotal = p.items.reduce((s, i) => s + (i.total || 0), 0);
  const tax = subtotal * (p.tax_rate || 0.12);
  const total = subtotal + tax;

  return (
    <div className="p-8 max-w-5xl">
      <button onClick={() => navigate("/app/proposals")} className="text-sm text-brand-midnight/60 hover:text-brand-orange inline-flex items-center gap-1 mb-4" data-testid="proposal-back">
        <ArrowLeft size={14} /> Volver a propuestas
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[260px]">
          <div className="text-xs uppercase tracking-wider font-bold text-brand-orange mb-1">
            Propuesta {p.generated_by_ai ? "· generada con IA" : ""}
          </div>
          <Input
            value={p.title}
            onChange={(e) => setP({ ...p, title: e.target.value })}
            className="text-3xl font-display font-bold border-0 px-0 focus-visible:ring-0"
            data-testid="proposal-title-input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={p.status} onValueChange={(s) => save(s)}>
            <SelectTrigger className="w-40" data-testid="proposal-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="accepted">Aceptada</SelectItem>
              <SelectItem value="rejected">Rechazada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={downloadPdf} data-testid="download-pdf-button" className="rounded-full">
            <Download size={16} className="mr-1" /> Descargar PDF
          </Button>
          <Button onClick={() => save()} disabled={saving} className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="save-proposal-button">
            <Save size={16} className="mr-1" /> Guardar
          </Button>
          {p.status === "draft" && (
            <Button onClick={() => save("sent")} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full" data-testid="send-proposal-button">
              <Send size={16} className="mr-1" /> Marcar enviada
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-black/5 p-6">
            <Label className="text-xs uppercase tracking-wider font-bold">Resumen ejecutivo</Label>
            <Textarea value={p.summary || ""} onChange={(e) => setP({ ...p, summary: e.target.value })} className="mt-2" data-testid="proposal-summary" />
            <Label className="text-xs uppercase tracking-wider font-bold mt-4 block">Alcance</Label>
            <Textarea value={p.scope || ""} onChange={(e) => setP({ ...p, scope: e.target.value })} className="mt-2" data-testid="proposal-scope" />
            <Label className="text-xs uppercase tracking-wider font-bold mt-4 block">Objetivos (uno por línea)</Label>
            <Textarea
              value={(p.objectives || []).join("\n")}
              onChange={(e) => setP({ ...p, objectives: e.target.value.split("\n").filter(Boolean) })}
              className="mt-2"
              data-testid="proposal-objectives"
            />
          </div>

          <div className="bg-white rounded-2xl border border-black/5 p-6">
            <div className="flex justify-between items-center mb-3">
              <Label className="text-xs uppercase tracking-wider font-bold">Detalle de servicios</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="rounded-full" data-testid="add-item-button">
                <Plus size={14} className="mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-3">
              {p.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start border-b border-black/5 pb-3" data-testid={`item-${idx}`}>
                  <Input className="col-span-4" placeholder="Servicio" value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                  <Input className="col-span-4" placeholder="Descripción" value={it.description || ""} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                  <Input className="col-span-1" type="number" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} />
                  <Input className="col-span-2" type="number" placeholder="Precio U." value={it.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                  <button className="col-span-1 text-rose-500 hover:bg-rose-50 rounded-md flex items-center justify-center" onClick={() => removeItem(idx)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 p-6">
            <Label className="text-xs uppercase tracking-wider font-bold mb-3 block">Cronograma</Label>
            <div className="space-y-3">
              {(p.phases || []).map((ph, idx) => (
                <div key={idx} className="border border-black/10 rounded-xl p-3" data-testid={`phase-${idx}`}>
                  <div className="grid grid-cols-12 gap-2">
                    <Input className="col-span-7" value={ph.name} onChange={(e) => {
                      const phases = [...p.phases];
                      phases[idx] = { ...phases[idx], name: e.target.value };
                      setP({ ...p, phases });
                    }} placeholder="Nombre de fase" />
                    <Input className="col-span-2" type="number" value={ph.duration_weeks} onChange={(e) => {
                      const phases = [...p.phases];
                      phases[idx] = { ...phases[idx], duration_weeks: parseFloat(e.target.value) || 0 };
                      setP({ ...p, phases });
                    }} />
                    <span className="col-span-2 text-xs self-center text-brand-midnight/55">semanas</span>
                    <button className="col-span-1 text-rose-500" onClick={() => setP({ ...p, phases: p.phases.filter((_, i) => i !== idx) })}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Textarea
                    className="mt-2 text-xs"
                    value={(ph.deliverables || []).join("\n")}
                    onChange={(e) => {
                      const phases = [...p.phases];
                      phases[idx] = { ...phases[idx], deliverables: e.target.value.split("\n").filter(Boolean) };
                      setP({ ...p, phases });
                    }}
                    placeholder="Entregables (uno por línea)"
                  />
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setP({ ...p, phases: [...(p.phases || []), { name: "", duration_weeks: 1, deliverables: [] }] })} className="rounded-full">
                <Plus size={14} className="mr-1" /> Agregar fase
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-brand-midnight text-white rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs uppercase tracking-wider text-brand-orange font-bold mb-3">Totales</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/65">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal, p.currency)}</span></div>
              <div className="flex justify-between"><span className="text-white/65">Impuestos ({((p.tax_rate || 0.12) * 100).toFixed(0)}%)</span><span className="font-semibold">{formatCurrency(tax, p.currency)}</span></div>
              <div className="flex justify-between pt-2 border-t border-white/10 mt-2"><span className="text-white">Total</span><span className="font-display font-bold text-2xl text-brand-orange" data-testid="proposal-total">{formatCurrency(total, p.currency)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-black/5 p-6 text-sm">
            <div className="text-xs uppercase tracking-wider font-bold text-brand-midnight/55 mb-2">Detalles</div>
            <div className="space-y-1">
              <div><span className="text-brand-midnight/55">Moneda:</span> <strong>{p.currency}</strong></div>
              <div><span className="text-brand-midnight/55">Generada por IA:</span> <strong>{p.generated_by_ai ? "Sí" : "No"}</strong></div>
              <div><span className="text-brand-midnight/55">Estado:</span> <strong className="capitalize">{p.status}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
