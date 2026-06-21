import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe,
  MonitorSmartphone,
  Users,
  Bot,
  PhoneCall,
  Database,
  Workflow,
  Sparkles,
  Check,
  Star,
  Quote,
} from "lucide-react";

const services = [
  { icon: Globe, name: "Página Web", desc: "Sitios web profesionales, responsive y orientados a conversión." },
  { icon: MonitorSmartphone, name: "Landing Page", desc: "Landings de alta conversión para campañas y lanzamientos." },
  { icon: Users, name: "CRM", desc: "Gestiona leads y ventas en un pipeline visual y automatizado." },
  { icon: Bot, name: "Chatbot IA", desc: "Asistentes con IA conectados a WhatsApp y web 24/7." },
  { icon: PhoneCall, name: "Agente de Voz IA", desc: "Recibe llamadas, agenda y deriva — sin sumar personal." },
  { icon: Database, name: "ERP", desc: "Centraliza inventario, finanzas, ventas y operaciones." },
  { icon: Workflow, name: "Automatizaciones", desc: "Flujos comerciales y operativos sin código, listos para escalar." },
];

const cases = [
  {
    company: "Distribuidora Maya",
    industry: "Retail",
    result: "+184% leads calificados en 90 días",
    quote: "Implementaron CRM + Chatbot IA y nuestro equipo dejó de perder oportunidades. Cerramos más con menos esfuerzo.",
    person: "Andrea Méndez · Gerente Comercial",
  },
  {
    company: "Clínica Vida",
    industry: "Salud",
    result: "Agente de voz IA atiende 92% de citas",
    quote: "El agente de voz redujo nuestra carga de llamadas y agendó más citas en el primer mes que el call center anterior.",
    person: "Dr. Luis Paredes · Director",
  },
  {
    company: "Constructora Solid",
    industry: "Construcción",
    result: "ERP + automatizaciones: -38% costos op.",
    quote: "Integraron nuestro ERP con automatizaciones que antes eran manuales. Ahora todo el equipo trabaja con data en tiempo real.",
    person: "Carla Ruiz · COO",
  },
];

const steps = [
  { n: "01", t: "Diagnóstico", d: "Responde 5 pasos guiados. Tarda menos de 5 minutos." },
  { n: "02", t: "Recomendaciones IA", d: "Recibirás un plan personalizado con servicios priorizados." },
  { n: "03", t: "Propuesta y reunión", d: "Te entregamos propuesta a medida y agendamos kickoff." },
];

const stats = [
  { value: "+120", label: "Empresas potenciadas" },
  { value: "+58 pts", label: "Madurez digital promedio en 6 meses" },
  { value: "24h", label: "De diagnóstico a propuesta" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-brand-midnight">
      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <span className="font-display font-bold tracking-tight">
              Innovagraf <span className="text-brand-orange">Growth</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-midnight/70">
            <a href="#servicios" className="hover:text-brand-orange transition">Servicios</a>
            <a href="#casos" className="hover:text-brand-orange transition">Casos</a>
            <a href="#proceso" className="hover:text-brand-orange transition">Proceso</a>
            <Link to="/login" className="hover:text-brand-orange transition" data-testid="landing-login-link">
              Login
            </Link>
            <Link to="/signup" className="hover:text-brand-orange transition" data-testid="landing-signup-link">
              Crear workspace
            </Link>
          </nav>
          <Link to="/diagnostico" data-testid="landing-cta-nav">
            <Button className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-5">
              Diagnóstico gratis
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute inset-0 dotted-bg opacity-60 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-midnight text-white text-xs font-bold tracking-[0.2em] uppercase mb-6">
              <span className="w-1.5 h-1.5 bg-brand-orange rounded-full" />
              Innovagraf Growth System
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tighter">
              Convertimos tu empresa en una{" "}
              <span className="text-brand-orange">máquina digital</span> de crecimiento.
            </h1>
            <p className="mt-6 text-lg text-brand-midnight/70 max-w-xl leading-relaxed">
              Diagnóstico inteligente + plan personalizado de páginas web, CRM, automatización,
              chatbots y agentes de IA. Sin reuniones eternas, sin propuestas genéricas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/diagnostico" data-testid="hero-cta-primary">
                <Button
                  size="lg"
                  className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-6 h-12 text-base shadow-lg shadow-brand-orange/25 hover:shadow-xl hover:shadow-brand-orange/30"
                >
                  Iniciar diagnóstico gratis <ArrowRight size={18} className="ml-1" />
                </Button>
              </Link>
              <a href="#servicios">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6 h-12 text-base border-brand-midnight/20 hover:bg-white"
                  data-testid="hero-cta-secondary"
                >
                  Ver servicios
                </Button>
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-brand-midnight/60">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={16} className="fill-brand-orange text-brand-orange" />
                ))}
              </div>
              <span>+120 empresas potenciadas en Centroamérica</span>
            </div>
            <div className="mt-12 grid grid-cols-3 max-w-md divide-x divide-black/10 border-t border-black/10 pt-6">
              {stats.map((s) => (
                <div key={s.label} className="px-4 first:pl-0">
                  <div className="font-display text-2xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-xs text-brand-midnight/55 mt-1 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-3xl overflow-hidden border border-black/10 shadow-2xl bg-brand-midnight">
              <img
                src="https://images.unsplash.com/photo-1470075801209-17f9ec0cada6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBnbGFzcyUyMG9mZmljZSUyMGFyY2hpdGVjdHVyZSUyMHN1bnNldHxlbnwwfHx8fDE3ODEyODkxMjl8MA&ixlib=rb-4.1.0&q=85"
                alt="Innovagraf"
                className="w-full h-[420px] object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-midnight via-brand-midnight/60 to-transparent" />
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Diagnóstico en vivo
              </motion.div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-2">
                  Madurez digital
                </div>
                <div className="font-display text-4xl font-bold">+58 puntos</div>
                <div className="text-white/70 text-sm mt-1">
                  Score promedio que aumentan nuestros clientes en 6 meses.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicios" className="py-24 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">Servicios</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
              Todo lo que tu empresa necesita para crecer digital.
            </h2>
            <p className="mt-4 text-brand-midnight/70 text-lg">
              Soluciones integradas, no parches. Cada servicio se diseña para conectar con los
              demás y multiplicar tus resultados.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s, idx) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className="group bg-white border border-black/10 rounded-2xl p-7 hover:border-brand-orange/40 hover:shadow-md transition-all"
                data-testid={`service-card-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-5 group-hover:bg-brand-orange group-hover:text-white transition">
                  <s.icon size={22} />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{s.name}</h3>
                <p className="text-sm text-brand-midnight/65 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="proceso" className="py-24 bg-brand-midnight text-white relative overflow-hidden grain">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-orange/30 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">Proceso</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
              De diagnóstico a propuesta en 24 horas.
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, idx) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="border border-white/10 rounded-2xl p-7 bg-white/5 hover:bg-white/10 hover:border-brand-orange/30 transition-all"
                data-testid={`process-step-${s.n}`}
              >
                <div className="font-display text-5xl font-bold text-brand-orange mb-3">{s.n}</div>
                <div className="font-semibold text-xl mb-2">{s.t}</div>
                <div className="text-white/70 text-sm">{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CASES */}
      <section id="casos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">
              Casos de éxito
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
              Empresas que ya crecen con Innovagraf.
            </h2>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-6">
            {cases.map((c, idx) => (
              <motion.div
                key={c.company}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="border border-black/10 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 hover:border-brand-orange/30 transition-all bg-white"
                data-testid={`case-${c.company.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Quote size={22} className="text-brand-orange" />
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} size={12} className="fill-brand-orange text-brand-orange" />
                    ))}
                  </div>
                </div>
                <p className="text-brand-midnight leading-relaxed mb-6">&ldquo;{c.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-brand-orange/10 text-brand-orange font-display font-bold flex items-center justify-center text-sm shrink-0">
                    {c.person.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">{c.person}</div>
                    <div className="text-xs text-brand-midnight/55">{c.company} · {c.industry}</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange bg-brand-orange/5 rounded-full px-3 py-1.5">
                  <Check size={16} /> {c.result}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="bg-brand-midnight text-white rounded-3xl p-12 md:p-16 relative overflow-hidden grain shadow-2xl"
          >
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-orange/30 rounded-full blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
                  ¿Listo para tu diagnóstico?
                </h2>
                <p className="mt-4 text-white/70 text-lg">
                  Menos de 5 minutos. Recibe un plan personalizado con IA y propuesta detallada.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Link to="/diagnostico" data-testid="bottom-cta">
                  <Button
                    size="lg"
                    className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-8 h-14 text-base shadow-lg shadow-brand-orange/25 hover:shadow-xl hover:shadow-brand-orange/30"
                  >
                    Empezar ahora <ArrowRight size={18} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <span className="font-display font-bold tracking-tight">
                Innovagraf <span className="text-brand-orange">Growth</span>
              </span>
            </Link>
            <p className="text-sm text-brand-midnight/60 max-w-sm leading-relaxed">
              Diagnóstico inteligente y ejecución de páginas web, CRM, automatización, chatbots y
              agentes de IA para empresas que quieren crecer en serio.
            </p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] uppercase font-bold text-brand-midnight/40 mb-4">
              Producto
            </div>
            <div className="flex flex-col gap-3 text-sm text-brand-midnight/70">
              <a href="#servicios" className="hover:text-brand-orange transition">Servicios</a>
              <a href="#casos" className="hover:text-brand-orange transition">Casos de éxito</a>
              <a href="#proceso" className="hover:text-brand-orange transition">Proceso</a>
              <Link to="/diagnostico" className="hover:text-brand-orange transition">Diagnóstico gratis</Link>
            </div>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] uppercase font-bold text-brand-midnight/40 mb-4">
              Empresa
            </div>
            <div className="flex flex-col gap-3 text-sm text-brand-midnight/70">
              <Link to="/login" className="hover:text-brand-orange transition">Acceso equipo</Link>
              <Link to="/signup" className="hover:text-brand-orange transition">Crear workspace</Link>
              <a href="mailto:contacto@innovagraf.com.gt" className="hover:text-brand-orange transition">
                contacto@innovagraf.com.gt
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-black/5">
          <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-brand-midnight/50">
            © {new Date().getFullYear()} Innovagraf Growth System — Guatemala.
          </div>
        </div>
      </footer>
    </div>
  );
}
