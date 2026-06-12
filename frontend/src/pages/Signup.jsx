import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    workspace_name: "",
    workspace_slug: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const onChange = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "workspace_name" && !slugTouched) {
        next.workspace_slug = slugify(v);
      }
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.admin_password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      localStorage.setItem("innovagraf_token", data.token);
      localStorage.setItem("innovagraf_user", JSON.stringify(data.user));
      // Reuse login flow to populate context properly
      await login(form.admin_email, form.admin_password);
      toast.success(`¡Workspace "${data.user.workspace.name}" creado!`);
      navigate("/app/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
      toast.error(msg || "No se pudo crear el workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-brand-midnight text-white overflow-hidden">
        <div className="absolute inset-0 dotted-bg opacity-20" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-orange/30 rounded-full blur-3xl" />
        <div className="relative p-12 flex flex-col justify-between w-full">
          <Link to="/" className="flex items-center gap-2" data-testid="signup-back-home">
            <div className="w-9 h-9 rounded-lg bg-brand-orange flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <span className="font-display font-bold">Innovagraf <span className="text-brand-orange">Growth</span></span>
          </Link>
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-4">
              Tu workspace propio
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tighter leading-tight">
              Crea tu workspace<br />y empieza a captar<br />leads en minutos.
            </h1>
            <p className="mt-6 text-white/60 max-w-md">
              Tu propia URL pública de diagnóstico, CRM, agenda y generador de propuestas con IA.
              Cada workspace es 100% privado.
            </p>
          </div>
          <div className="text-xs text-white/40">© Innovagraf Growth System</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[#FAFAFA]">
        <form onSubmit={onSubmit} className="w-full max-w-md" data-testid="signup-form">
          <Link to="/" className="lg:hidden text-sm text-brand-midnight/60 flex items-center gap-1 mb-6">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">Registro</div>
          <h2 className="font-display text-3xl font-bold tracking-tight mt-2">Crear workspace</h2>
          <p className="text-sm text-brand-midnight/60 mt-1 mb-8">
            Gratis. Sin tarjeta. Tu URL de diagnóstico se genera automáticamente.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider font-bold">Nombre del workspace</Label>
              <Input
                value={form.workspace_name}
                onChange={(e) => onChange("workspace_name", e.target.value)}
                placeholder="Ej. Acme Corp"
                data-testid="signup-workspace-name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider font-bold">Slug público</Label>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-brand-midnight/55 whitespace-nowrap">/diagnostico/w/</span>
                <Input
                  value={form.workspace_slug}
                  onChange={(e) => { setSlugTouched(true); onChange("workspace_slug", slugify(e.target.value)); }}
                  placeholder="acme"
                  data-testid="signup-workspace-slug"
                  pattern="[a-z0-9-]+"
                  required
                />
              </div>
              <p className="text-xs text-brand-midnight/55 mt-1">
                Sólo minúsculas, números y guiones.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider font-bold">Tu nombre</Label>
                <Input
                  value={form.admin_name}
                  onChange={(e) => onChange("admin_name", e.target.value)}
                  data-testid="signup-admin-name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider font-bold">Email</Label>
                <Input
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => onChange("admin_email", e.target.value)}
                  data-testid="signup-admin-email"
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider font-bold">Contraseña (mín. 6)</Label>
              <Input
                type="password"
                value={form.admin_password}
                onChange={(e) => onChange("admin_password", e.target.value)}
                data-testid="signup-admin-password"
                required
                minLength={6}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="signup-submit-button"
            className="w-full mt-6 bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full h-11"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Crear mi workspace"}
          </Button>
          <p className="mt-6 text-sm text-brand-midnight/60 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-brand-orange font-semibold hover:underline" data-testid="signup-to-login">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
