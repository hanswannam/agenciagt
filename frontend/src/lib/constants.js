export const STATUS_LABELS = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  diagnostico_completo: "Diagnóstico Completo",
  reunion_agendada: "Reunión Agendada",
  propuesta_enviada: "Propuesta Enviada",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

export const STATUS_COLORS = {
  nuevo: "bg-slate-100 text-slate-700 border-slate-300",
  contactado: "bg-blue-50 text-blue-700 border-blue-300",
  diagnostico_completo: "bg-indigo-50 text-indigo-700 border-indigo-300",
  reunion_agendada: "bg-violet-50 text-violet-700 border-violet-300",
  propuesta_enviada: "bg-amber-50 text-amber-700 border-amber-300",
  negociacion: "bg-orange-50 text-orange-700 border-orange-300",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-300",
  perdido: "bg-rose-50 text-rose-700 border-rose-300",
};

export const STATUSES = Object.keys(STATUS_LABELS);

export const SERVICES = [
  "Página Web",
  "Landing Page",
  "CRM",
  "Chatbot IA",
  "Agente de Voz IA",
  "ERP",
  "Automatizaciones",
];

export function formatCurrency(n, currency = "USD") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
