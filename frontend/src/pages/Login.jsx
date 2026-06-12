import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@innovagraf.com");
  const [password, setPassword] = useState("Innovagraf2026!");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("¡Bienvenido de vuelta!");
      navigate("/app/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Error al iniciar sesión";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-brand-midnight text-white overflow-hidden">
        <div className="absolute inset-0 dotted-bg opacity-20" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-orange/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl" />
        <div className="relative p-12 flex flex-col justify-between w-full">
          <Link to="/" className="flex items-center gap-2" data-testid="login-back-home">
            <div className="w-9 h-9 rounded-lg bg-brand-orange flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <span className="font-display font-bold">Innovagraf <span className="text-brand-orange">Growth</span></span>
          </Link>
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-4">
              Panel de equipo
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tighter leading-tight">
              Gestiona leads,<br />reuniones y propuestas<br />en un solo lugar.
            </h1>
            <p className="mt-6 text-white/60 max-w-md">
              Pipeline visual, dashboard ejecutivo y generador de propuestas con IA. Diseñado para
              equipos comerciales que crecen.
            </p>
          </div>
          <div className="text-xs text-white/40">© Innovagraf Growth System</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm" data-testid="login-form">
          <Link to="/" className="lg:hidden text-sm text-brand-midnight/60 flex items-center gap-1 mb-6">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">Acceso</div>
          <h2 className="font-display text-3xl font-bold tracking-tight mt-2">Inicia sesión</h2>
          <p className="text-sm text-brand-midnight/60 mt-1 mb-8">
            Ingresa con tus credenciales del equipo Innovagraf.
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider font-bold">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider font-bold">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                required
                className="mt-1"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="login-submit-button"
            className="w-full mt-6 bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full h-11"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Entrar"}
          </Button>
          <div className="mt-6 text-xs text-brand-midnight/55 leading-relaxed">
            Demo: <code className="px-1.5 py-0.5 rounded bg-black/5">admin@innovagraf.com</code> /{" "}
            <code className="px-1.5 py-0.5 rounded bg-black/5">Innovagraf2026!</code>
          </div>
          <p className="mt-6 text-sm text-brand-midnight/60 text-center">
            ¿Aún no tienes workspace?{" "}
            <Link to="/signup" className="text-brand-orange font-semibold hover:underline" data-testid="login-to-signup">
              Crear uno gratis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
