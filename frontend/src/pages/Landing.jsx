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
          </nav>
          <Link to="/diagnostico" data-testid="landing-cta-nav">
            <Button className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-5">
              Diagnóstico gratis
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dotted-bg opacity-60 pointer-events-none" />
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
                  className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-6 h-12 text-base"
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
          <div className="max-w-2xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">Servicios</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
              Todo lo que tu empresa necesita para crecer digital.
            </h2>
            <p className="mt-4 text-brand-midnight/70 text-lg">
              Soluciones integradas, no parches. Cada servicio se diseña para conectar con los
              demás y multiplicar tus resultados.
            </p>
          </div>
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
      <section id="proceso" className="py-24 bg-brand-midnight text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-orange/30 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-2xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">Proceso</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
              De diagnóstico a propuesta en 24 horas.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.n}
                className="border border-white/10 rounded-2xl p-7 bg-white/5 hover:bg-white/10 transition"
                data-testid={`process-step-${s.n}`}
              >
                <div className="font-display text-5xl font-bold text-brand-orange mb-3">{s.n}</div>
                <div className="font-semibold text-xl mb-2">{s.t}</div>
                <div className="text-white/70 text-sm">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASES */}
      <section id="casos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">
              Casos de éxito
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter">
              Empresas que ya crecen con Innovagraf.
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {cases.map((c) => (
              <div
                key={c.company}
                className="border border-black/10 rounded-2xl p-7 hover:shadow-lg transition"
                data-testid={`case-${c.company.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Quote size={22} className="text-brand-orange mb-4" />
                <p className="text-brand-midnight leading-relaxed mb-6">&ldquo;{c.quote}&rdquo;</p>
                <div className="text-sm font-semibold">{c.person}</div>
                <div className="text-xs text-brand-midnight/55">{c.company} · {c.industry}</div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
                  <Check size={16} /> {c.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-brand-midnight text-white rounded-3xl p-12 md:p-16 relative overflow-hidden">
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
                    className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-8 h-14 text-base"
                  >
                    Empezar ahora <ArrowRight size={18} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between gap-4 text-sm text-brand-midnight/60">
          <div>© {new Date().getFullYear()} Innovagraf Growth System — Guatemala.</div>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-brand-orange">Acceso equipo</Link>
            <a href="mailto:contacto@innovagraf.com.gt" className="hover:text-brand-orange">contacto@innovagraf.com.gt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
