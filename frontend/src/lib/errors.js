import { toast } from "sonner";

/**
 * Centralized API error toaster. Handles plan-limit errors (HTTP 402)
 * with an upgrade prompt; falls back to a regular toast otherwise.
 */
export function handleApiError(err, fallback = "Ocurrió un error inesperado") {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  const message = Array.isArray(detail) ? detail[0]?.msg : detail;

  if (status === 402) {
    toast.error("Upgrade requerido", {
      description: message || "Esta función requiere un plan superior.",
      duration: 6000,
    });
    return;
  }
  if (status === 401) {
    toast.error("Sesión expirada. Inicia sesión de nuevo.");
    return;
  }
  toast.error(message || fallback);
}
