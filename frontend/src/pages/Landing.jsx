import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import {
  ArrowRight,
  Users,
  LayoutGrid,
  Globe,
  MessageSquare,
  Mic,
  Smartphone,
  Sparkles,
} from "lucide-react";

const services = [
  { icon: Users, key: "svc1", name: "CRM", desc: "Gestiona clientes, ventas y pipeline en un CRM hecho a la medida de tu equipo, con automatizaciones e IA integradas.", descEn: "Manage clients, sales and pipeline in a CRM tailored to your team, with automations and AI built in.", wide: true, accent: true },
  { icon: LayoutGrid, key: "svc2", name: "ERP", desc: "Integra inventario, finanzas y operaciones en un solo sistema.", descEn: "Unify inventory, finance and operations in a single system." },
  { icon: Globe, key: "svc3", name: "Páginas web", nameEn: "Websites", desc: "Sitios rápidos, modernos y optimizados para convertir.", descEn: "Fast, modern sites optimized to convert." },
  { icon: MessageSquare, key: "svc4", name: "Chatbots", desc: "Atiende y vende automáticamente, 24/7, en todos tus canales.", descEn: "Support and sell automatically, 24/7, across every channel." },
  { icon: Mic, key: "svc5", name: "Asistentes de voz", nameEn: "Voice assistants", desc: "Respuestas naturales por voz para soporte y reservas.", descEn: "Natural voice responses for support and bookings." },
  { icon: Smartphone, key: "svc6", name: "Aplicaciones web", nameEn: "Web apps", desc: "Apps a medida que digitalizan tus procesos clave.", descEn: "Custom apps that digitize your key processes." },
  { icon: Sparkles, key: "svc7", name: "Agentes de IA", nameEn: "AI agents", desc: "Agentes autónomos que ejecutan tareas y toman decisiones por ti.", descEn: "Autonomous agents that run tasks and make decisions for you.", accent: true },
];

const steps = [
  { n: "01", es: "Diagnóstico y estrategia", en: "Diagnosis & strategy" },
  { n: "02", es: "Diseño e integración", en: "Design & integration" },
  { n: "03", es: "Automatización con IA", en: "AI automation" },
  { n: "04", es: "Soporte y evolución", en: "Support & evolution" },
];

const testimonials = [
  {
    quote: "Implementamos el CRM y los chatbots de Innovagraf y duplicamos las oportunidades cerradas en un trimestre.",
    quoteEn: "We rolled out the CRM and Innovagraf chatbots and doubled closed opportunities in one quarter.",
    initials: "MR",
    name: "María Robles",
    role: "Dir. Comercial, Norvex",
    roleEn: "Sales Director, Norvex",
    grad: "linear-gradient(135deg,#ff7a2e,#b8330a)",
    color: "#160a04",
  },
  {
    quote: "El ERP a medida nos quitó horas de trabajo manual cada semana. Por fin todo vive en un solo lugar.",
    quoteEn: "The custom ERP saved us hours of manual work every week. Everything finally lives in one place.",
    initials: "JC",
    name: "Jorge Cano",
    role: "COO, Grupo Avanti",
    roleEn: "COO, Grupo Avanti",
    grad: "linear-gradient(135deg,#ffb07a,#ff5414)",
    color: "#160a04",
  },
  {
    quote: "Sus agentes de IA atienden a nuestros clientes 24/7. La experiencia es tan natural que casi nadie nota la diferencia.",
    quoteEn: "Their AI agents handle our customers 24/7. The experience is so natural almost no one notices.",
    initials: "LP",
    name: "Lucía Paredes",
    role: "CEO, Lumina",
    roleEn: "CEO, Lumina",
    grad: "linear-gradient(135deg,#7a4a2e,#3a1a0a)",
    color: "#f6efe6",
  },
];

const trustNames = ["Norvex", "Lumina", "Grupo Avanti", "Quanta", "Mercurio"];

export default function Landing() {
  const [lang, setLang] = useState("es");
  const t = (es, en) => (lang === "es" ? es : en);

  const canvasRef = useRef(null);
  const robotRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const robot = robotRef.current;
    if (robot) {
      robot.style.opacity = "0";
      robot.style.transition = "opacity .5s ease";
    }
    const ctx = cv ? cv.getContext("2d") : null;
    const mouse = { x: null, y: null };
    const rob = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
    const C = "255,138,68";
    let w = 0;
    let h = 0;
    let dpr = 1;
    let P = [];

    const resize = () => {
      if (!cv) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.max(30, Math.floor((w * h) / 14000)));
      P = [];
      for (let i = 0; i < n; i++) {
        P.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.6 + 0.7 });
      }
    };
    resize();

    const onResize = () => resize();
    const onMove = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      mouse.x = pt.clientX;
      mouse.y = pt.clientY;
      if (robot) robot.style.opacity = "1";
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    const D = 140;
    const MD = 185;
    let raf;
    const tick = () => {
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        const mx = mouse.x;
        const my = mouse.y;
        for (const p of P) {
          if (mx != null) {
            const dx = p.x - mx;
            const dy = p.y - my;
            const d = Math.hypot(dx, dy);
            if (d < MD && d > 0.1) {
              const f = ((MD - d) / MD) * 0.9;
              p.vx += (dx / d) * f * 0.06;
              p.vy += (dy / d) * f * 0.06;
            }
          }
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.985;
          p.vy *= 0.985;
          if (Math.hypot(p.vx, p.vy) < 0.05) {
            p.vx += (Math.random() - 0.5) * 0.05;
            p.vy += (Math.random() - 0.5) * 0.05;
          }
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          p.x = Math.max(0, Math.min(w, p.x));
          p.y = Math.max(0, Math.min(h, p.y));
        }
        for (let i = 0; i < P.length; i++) {
          const a = P[i];
          for (let j = i + 1; j < P.length; j++) {
            const b = P[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d = Math.hypot(dx, dy);
            if (d < D) {
              const o = (1 - d / D) * 0.45;
              ctx.strokeStyle = `rgba(${C},${o.toFixed(3)})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
          if (mx != null) {
            const dx = a.x - mx;
            const dy = a.y - my;
            const d = Math.hypot(dx, dy);
            if (d < MD) {
              const o = (1 - d / MD) * 0.7;
              ctx.strokeStyle = `rgba(${C},${o.toFixed(3)})`;
              ctx.lineWidth = 0.9;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(mx, my);
              ctx.stroke();
            }
          }
        }
        for (const p of P) {
          ctx.fillStyle = `rgba(${C},0.8)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fill();
        }
      }
      if (robot) {
        const tx = (mouse.x == null ? window.innerWidth / 2 : mouse.x) + 22;
        const ty = (mouse.y == null ? window.innerHeight * 0.4 : mouse.y) + 22;
        const px = rob.x;
        rob.x += (tx - rob.x) * 0.085;
        rob.y += (ty - rob.y) * 0.085;
        const tilt = Math.max(-14, Math.min(14, (rob.x - px) * 2.4));
        robot.style.transform = `translate(${rob.x}px,${rob.y}px) rotate(${tilt}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink text-[#f6efe6] font-manrope overflow-x-hidden relative" style={{ maxWidth: "100vw" }}>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" />
      <div
        ref={robotRef}
        className="fixed left-0 top-0 z-20 pointer-events-none"
        style={{ transform: "translate(-200px,-200px)", willChange: "transform" }}
      >
        <div
          className="relative flex items-center justify-center gap-2"
          style={{
            width: "56px",
            height: "52px",
            borderRadius: "15px",
            background: "linear-gradient(150deg,#2a2018,#14100c)",
            border: "1px solid rgba(255,122,46,.55)",
            boxShadow: "0 10px 26px rgba(255,84,20,.4), 0 0 22px rgba(255,122,46,.3)",
          }}
        >
          <span className="absolute" style={{ top: "-11px", left: "calc(50% - 1px)", width: "2px", height: "9px", background: "#ff7a2e" }} />
          <span className="absolute rounded-full" style={{ top: "-16px", left: "calc(50% - 3px)", width: "7px", height: "7px", background: "#ff8a44", boxShadow: "0 0 9px #ff7a2e" }} />
          <span className="rounded-full" style={{ width: "12px", height: "12px", background: "#ff8a44", boxShadow: "0 0 11px #ff7a2e" }} />
          <span className="rounded-full" style={{ width: "12px", height: "12px", background: "#ff8a44", boxShadow: "0 0 11px #ff7a2e" }} />
          <span className="absolute rounded-[3px]" style={{ bottom: "9px", left: "50%", transform: "translateX(-50%)", width: "18px", height: "3px", background: "rgba(255,138,68,.55)" }} />
        </div>
      </div>

      {/* ambient glows */}
      <div
        className="dc-glow-pulse absolute -top-32 -right-20 w-[720px] h-[720px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,84,20,.32), transparent 62%)", filter: "blur(20px)" }}
      />
      <div
        className="absolute top-[1180px] -left-52 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,122,46,.16), transparent 64%)", filter: "blur(20px)" }}
      />

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.07]" style={{ background: "rgba(12,10,8,.72)" }}>
        <div className="max-w-[1200px] mx-auto p-4 sm:px-7 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-[13px] sm:gap-6">
          <Link to="/" className="flex items-center" data-testid="landing-logo">
            <span className="flex items-center bg-white rounded-lg px-3 py-1.5 shadow-lg">
              <img src={logo} alt="Innovagraf" className="h-11 sm:h-7 w-auto" />
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#c3b6a8]">
            <a href="#servicios" className="hover:text-ember transition">{t("Servicios", "Services")}</a>
            <a href="#soluciones" className="hover:text-ember transition">{t("Soluciones", "Solutions")}</a>
            <a href="#testimonios" className="hover:text-ember transition">{t("Testimonios", "Testimonials")}</a>
            <a href="#contacto" className="hover:text-ember transition">{t("Contacto", "Contact")}</a>
          </div>
          <div className="flex items-center gap-3.5">
            <Link to="/login" className="hidden sm:inline text-sm text-[#c3b6a8] hover:text-ember transition" data-testid="landing-login-link">
              Login
            </Link>
            <div className="flex border border-white/[0.14] rounded-full overflow-hidden font-mono2 text-xs">
              <button
                onClick={() => setLang("es")}
                className="border-none cursor-pointer px-[11px] py-1.5 font-bold transition"
                style={{ background: lang === "es" ? "#ff7a2e" : "transparent", color: lang === "es" ? "#160a04" : "#c3b6a8" }}
              >
                ES
              </button>
              <button
                onClick={() => setLang("en")}
                className="border-none cursor-pointer px-[11px] py-1.5 transition"
                style={{ background: lang === "en" ? "#ff7a2e" : "transparent", color: lang === "en" ? "#160a04" : "#c3b6a8" }}
              >
                EN
              </button>
            </div>
            <Link to="/diagnostico" data-testid="landing-cta-nav" className="hidden sm:block">
              <Button
                className="rounded-full px-5 h-10 text-sm font-bold border-none"
                style={{ background: "linear-gradient(140deg,#ff7a2e,#ff5414)", color: "#160a04", boxShadow: "0 8px 24px rgba(255,84,20,.32)" }}
              >
                {t("Solicitar demo", "Book a demo")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative z-10 max-w-[1200px] mx-auto px-7 pt-16 sm:pt-20 pb-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="dc-fade-up">
          <div className="font-mono2 text-xs tracking-[0.22em] mb-5" style={{ color: "#ff8a44" }}>
            CRM · ERP · {t("IA", "AI")} · WEB · CHATBOTS
          </div>
          <h1 className="font-grotesk font-semibold text-[clamp(34px,6.2vw,62px)] leading-[1.04] tracking-tight mb-6">
            {t("Automatiza tu negocio con ", "Automate your business with ")}
            <span className="font-serifItalic italic font-normal" style={{ color: "#ff7a2e" }}>
              {t("inteligencia", "intelligence")}
            </span>
            {t(" que trabaja por ti.", " that works for you.")}
          </h1>
          <p className="text-lg leading-[1.62] max-w-[520px] mb-8" style={{ color: "#b6a99a" }}>
            {t(
              "Innovagraf diseña CRM, ERP, páginas web, chatbots, asistentes de voz y agentes de IA que se integran a tu operación y multiplican tus resultados.",
              "Innovagraf builds CRMs, ERPs, websites, chatbots, voice assistants and AI agents that plug into your operation and multiply your results."
            )}
          </p>
          <div className="flex flex-wrap gap-3.5 items-center mb-9">
            <Link to="/diagnostico" data-testid="hero-cta-primary">
              <Button
                className="rounded-full px-7 h-[52px] text-[15.5px] font-bold border-none"
                style={{ background: "linear-gradient(140deg,#ff7a2e,#ff5414)", color: "#160a04", boxShadow: "0 12px 32px rgba(255,84,20,.34)" }}
              >
                {t("Solicitar demo", "Book a demo")} <ArrowRight size={18} className="ml-1" />
              </Button>
            </Link>
            <a href="#servicios">
              <Button
                variant="outline"
                className="rounded-full px-6 h-[52px] text-[15.5px] font-semibold border-white/[0.16] text-[#f6efe6] bg-transparent hover:bg-white/5"
              >
                {t("Ver soluciones", "Explore solutions")}
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex">
              <span className="w-[38px] h-[38px] rounded-full border-2 border-ink" style={{ background: "linear-gradient(135deg,#ff7a2e,#b8330a)" }} />
              <span className="w-[38px] h-[38px] rounded-full border-2 border-ink -ml-3" style={{ background: "linear-gradient(135deg,#ffb07a,#ff5414)" }} />
              <span className="w-[38px] h-[38px] rounded-full border-2 border-ink -ml-3" style={{ background: "linear-gradient(135deg,#7a4a2e,#3a1a0a)" }} />
            </div>
            <span className="text-[13.5px]" style={{ color: "#9b8e80" }}>
              {t("+120 equipos ya automatizan con Innovagraf", "+120 teams already automate with Innovagraf")}
            </span>
          </div>
        </div>

        <div className="relative dc-fade-up" style={{ animationDuration: "0.9s" }}>
          <div
            className="relative h-[480px] rounded-[20px] overflow-hidden border border-white/[0.12]"
            style={{ background: "#0f0c0a", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
          >
            {/* window bar */}
            <div className="h-10 flex items-center gap-[7px] px-[15px] relative z-[3] border-b border-white/[0.07]" style={{ background: "#171310" }}>
              <span className="w-[11px] h-[11px] rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-[11px] h-[11px] rounded-full" style={{ background: "#febc2e" }} />
              <span className="w-[11px] h-[11px] rounded-full" style={{ background: "#28c840" }} />
              <span className="dc-tab-excel absolute inset-x-0 text-center font-mono2 text-[11px]" style={{ color: "#8a7d70" }}>
                Ventas.xlsx
              </span>
              <span className="dc-tab-crm absolute inset-x-0 text-center font-mono2 text-[11px]" style={{ color: "#ff8a44" }}>
                CRM — Pipeline
              </span>
            </div>

            <div className="relative h-[440px]">
              {/* EXCEL LAYER */}
              <div className="dc-excel-layer absolute inset-0 bg-white flex flex-col" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                <div className="h-[34px] flex items-center px-3" style={{ background: "#107c41" }}>
                  <span className="text-white font-bold text-[13px] tracking-wide">Σ  Ventas</span>
                  <span className="flex-1" />
                  <span className="text-[13px] tracking-[3px]" style={{ color: "#bfe8cf" }}>▦ ▤ ⌗ Σ</span>
                </div>
                <div className="h-6 flex items-center px-2.5 gap-2.5" style={{ background: "#f3f5f6", borderBottom: "1px solid #d6dadd" }}>
                  <span className="text-[10px] bg-white border rounded-sm px-[7px] py-px" style={{ color: "#6b7378", borderColor: "#d6dadd", fontFamily: "'Courier New',monospace" }}>B3</span>
                  <span className="text-[10px]" style={{ color: "#9aa1a6", fontFamily: "'Courier New',monospace" }}>fx &nbsp; Negociación</span>
                </div>
                <div className="flex-1 grid text-[11.5px]" style={{ gridTemplateRows: "18px repeat(7,1fr)", color: "#2a2e31" }}>
                  <div className="grid text-[9.5px]" style={{ gridTemplateColumns: "30px 1.5fr 1.2fr .95fr .9fr", background: "#f3f5f6", color: "#9aa1a6" }}>
                    <div style={{ borderRight: "1px solid #d6dadd", borderBottom: "1px solid #d6dadd" }} />
                    <div className="flex items-center justify-center" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #d6dadd" }}>A</div>
                    <div className="flex items-center justify-center" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #d6dadd" }}>B</div>
                    <div className="flex items-center justify-center" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #d6dadd" }}>C</div>
                    <div className="flex items-center justify-center" style={{ borderBottom: "1px solid #d6dadd" }}>D</div>
                  </div>
                  <div className="grid font-bold" style={{ gridTemplateColumns: "30px 1.5fr 1.2fr .95fr .9fr", background: "#eef6f1" }}>
                    <div className="flex items-center justify-center font-normal text-[10px]" style={{ background: "#f3f5f6", color: "#9aa1a6", borderRight: "1px solid #d6dadd", borderBottom: "1px solid #e3e7e9" }}>1</div>
                    <div className="flex items-center px-[9px]" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #e3e7e9" }}>Cliente</div>
                    <div className="flex items-center px-[9px]" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #e3e7e9" }}>Etapa</div>
                    <div className="flex items-center justify-end px-[9px]" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #e3e7e9" }}>Monto</div>
                    <div className="flex items-center px-[9px]" style={{ borderBottom: "1px solid #e3e7e9" }}>Cierre</div>
                  </div>
                  {[
                    ["2", "Norvex", "Negociación", "12,400", "12/03", true],
                    ["3", "Lumina", "Propuesta", "8,900", "15/03"],
                    ["4", "Grupo Avanti", "Ganado", "21,300", "09/03"],
                    ["5", "Quanta", "Contacto", "4,750", "20/03"],
                    ["6", "Mercurio", "Propuesta", "15,600", "18/03"],
                  ].map(([row, cliente, etapa, monto, cierre, highlight]) => (
                    <div key={row} className="grid" style={{ gridTemplateColumns: "30px 1.5fr 1.2fr .95fr .9fr" }}>
                      <div className="flex items-center justify-center text-[10px]" style={{ background: "#f3f5f6", color: "#9aa1a6", borderRight: "1px solid #d6dadd", borderBottom: "1px solid #e3e7e9" }}>{row}</div>
                      <div className="flex items-center px-[9px]" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #e3e7e9" }}>{cliente}</div>
                      <div
                        className="flex items-center px-[9px]"
                        style={highlight ? { border: "1.5px solid #107c41" } : { borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #e3e7e9" }}
                      >
                        {etapa}
                      </div>
                      <div className="flex items-center justify-end px-[9px]" style={{ borderRight: "1px solid #e3e7e9", borderBottom: "1px solid #e3e7e9" }}>{monto}</div>
                      <div className="flex items-center px-[9px]" style={{ borderBottom: "1px solid #e3e7e9", color: "#6b7378" }}>{cierre}</div>
                    </div>
                  ))}
                  <div className="grid" style={{ gridTemplateColumns: "30px 1.5fr 1.2fr .95fr .9fr" }}>
                    <div className="flex items-center justify-center text-[10px]" style={{ background: "#f3f5f6", color: "#9aa1a6", borderRight: "1px solid #d6dadd" }}>7</div>
                    <div style={{ borderRight: "1px solid #e3e7e9" }} />
                    <div style={{ borderRight: "1px solid #e3e7e9" }} />
                    <div style={{ borderRight: "1px solid #e3e7e9" }} />
                    <div />
                  </div>
                </div>
                <div
                  className="dc-scan-line absolute left-0 right-0 h-0.5 pointer-events-none"
                  style={{ background: "linear-gradient(90deg,transparent,#ff7a2e,transparent)", boxShadow: "0 0 14px 3px rgba(255,122,46,.6)" }}
                />
              </div>

              {/* CRM LAYER */}
              <div className="dc-crm-layer absolute inset-0 flex" style={{ background: "linear-gradient(160deg,#15110c,#0f0c0a)" }}>
                <div className="w-12 border-r border-white/[0.06] flex flex-col items-center gap-4 pt-4" style={{ background: "#171310" }}>
                  <span className="w-6 h-6 rounded-[7px]" style={{ background: "linear-gradient(140deg,#ff7a2e,#ff5414)" }} />
                  <span className="w-[22px] h-[22px] rounded-md" style={{ background: "rgba(255,122,46,.16)", border: "1px solid rgba(255,122,46,.4)" }} />
                  <span className="w-[22px] h-[22px] rounded-md bg-white/5" />
                  <span className="w-[22px] h-[22px] rounded-md bg-white/5" />
                </div>
                <div className="flex-1 px-[17px] py-[15px] flex flex-col gap-[13px] overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-grotesk font-semibold text-[15px] text-[#f6efe6]">{t("Pipeline de ventas", "Sales pipeline")}</div>
                      <div className="text-[10.5px] mt-0.5" style={{ color: "#9b8e80" }}>
                        {t("6 tratos · actualizado en tiempo real", "6 deals · updated in real time")}
                      </div>
                    </div>
                    <span
                      className="dc-pulse-dot font-bold text-[11px] px-[13px] py-[7px] rounded-full"
                      style={{ background: "linear-gradient(140deg,#ff7a2e,#ff5414)", color: "#160a04" }}
                    >
                      + {t("Nuevo trato", "New deal")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-[9px]">
                    <div className="rounded-[11px] px-[11px] py-2.5 bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[9.5px] tracking-wide" style={{ color: "#9b8e80" }}>{t("TRATOS", "DEALS")}</div>
                      <div className="font-grotesk font-bold text-[19px] mt-[3px]" style={{ color: "#ff8a44" }}>24</div>
                    </div>
                    <div className="rounded-[11px] px-[11px] py-2.5 bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[9.5px] tracking-wide" style={{ color: "#9b8e80" }}>{t("GANADOS", "WON")}</div>
                      <div className="font-grotesk font-bold text-[19px] mt-[3px]" style={{ color: "#ff8a44" }}>8</div>
                    </div>
                    <div className="rounded-[11px] px-[11px] py-2.5 bg-white/[0.04] border border-white/[0.08]">
                      <div className="text-[9.5px] tracking-wide" style={{ color: "#9b8e80" }}>{t("VALOR", "VALUE")}</div>
                      <div className="font-grotesk font-bold text-[19px] mt-[3px]" style={{ color: "#ff8a44" }}>Q63k</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[9px]">
                    {[
                      { i: "N", grad: "linear-gradient(135deg,#ff7a2e,#b8330a)", color: "#160a04", name: "Norvex", stage: t("Negociación", "Negotiation"), amount: "Q12,400", pct: "70%", width: "70%" },
                      { i: "L", grad: "linear-gradient(135deg,#ffb07a,#ff5414)", color: "#160a04", name: "Lumina", stage: t("Propuesta", "Proposal"), amount: "Q8,900", pct: "45%", width: "45%" },
                      { i: "A", grad: "linear-gradient(135deg,#7a4a2e,#3a1a0a)", color: "#f6efe6", name: "Grupo Avanti", stage: t("Cerrado", "Closed"), amount: "Q21,300", pct: t("Ganado", "Won"), width: "100%", won: true },
                    ].map((d) => (
                      <div key={d.name} className="dc-rise-in rounded-xl px-3 py-[11px] flex items-center gap-[11px] bg-white/[0.04] border border-white/[0.08]">
                        <span
                          className="flex-none w-[34px] h-[34px] rounded-full flex items-center justify-center font-grotesk font-bold text-[13px]"
                          style={{ background: d.grad, color: d.color }}
                        >
                          {d.i}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] font-semibold text-[#f6efe6]">{d.name}</span>
                            <span className="text-xs font-bold" style={{ color: d.won ? "#3fbf6a" : "#ff8a44" }}>{d.pct}</span>
                          </div>
                          <div className="text-[10.5px] my-[3px] mb-[7px]" style={{ color: "#9b8e80" }}>{d.stage} · {d.amount}</div>
                          <div className="h-1 rounded-full overflow-hidden bg-white/[0.08]">
                            <div
                              className="dc-bar-grow h-full rounded-full"
                              style={{ width: d.width, background: d.won ? "linear-gradient(90deg,#2f9e57,#3fbf6a)" : "linear-gradient(90deg,#ff7a2e,#ff5414)" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* metrics row */}
          <div className="flex gap-2.5 mt-4">
            <div className="flex-1 rounded-2xl px-[15px] py-[13px] border border-white/10" style={{ background: "rgba(20,15,11,.7)" }}>
              <div className="font-grotesk font-bold text-[22px]" style={{ color: "#ff8a44" }}>+40%</div>
              <div className="text-[11.5px]" style={{ color: "#b6a99a" }}>{t("en ventas", "in sales")}</div>
            </div>
            <div className="flex-1 rounded-2xl px-[15px] py-[13px] border border-white/10" style={{ background: "rgba(20,15,11,.7)" }}>
              <div className="font-grotesk font-bold text-[22px]" style={{ color: "#ff8a44" }}>−60%</div>
              <div className="text-[11.5px]" style={{ color: "#b6a99a" }}>{t("tareas manuales", "manual tasks")}</div>
            </div>
            <div className="flex-1 rounded-2xl px-[15px] py-[13px] border border-white/10" style={{ background: "rgba(20,15,11,.7)" }}>
              <div className="font-grotesk font-bold text-[22px]" style={{ color: "#ff8a44" }}>24/7</div>
              <div className="text-[11.5px]" style={{ color: "#b6a99a" }}>{t("atención con IA", "AI support")}</div>
            </div>
          </div>
        </div>
      </header>

      {/* TRUST STRIP */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-7 pb-5">
        <div className="rounded-[18px] border border-white/[0.08] px-8 py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-7 items-center" style={{ background: "rgba(22,17,12,.5)" }}>
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.18em] mb-4" style={{ color: "#7c7065" }}>
              {t("CONFÍAN EN NUESTRA TECNOLOGÍA", "TRUSTED BY GROWING TEAMS")}
            </div>
            <div className="flex flex-wrap gap-7 items-center opacity-60 font-grotesk font-semibold text-lg text-[#cabcae]">
              {trustNames.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-8 md:pl-8 md:border-l border-white/[0.08] flex-wrap">
            <div>
              <div className="font-grotesk font-bold text-[26px]" style={{ color: "#ff8a44" }}>120+</div>
              <div className="text-xs" style={{ color: "#9b8e80" }}>{t("Clientes activos", "Active clients")}</div>
            </div>
            <div>
              <div className="font-grotesk font-bold text-[26px]" style={{ color: "#ff8a44" }}>320+</div>
              <div className="text-xs" style={{ color: "#9b8e80" }}>{t("Proyectos entregados", "Projects delivered")}</div>
            </div>
            <div>
              <div className="font-grotesk font-bold text-[26px]" style={{ color: "#ff8a44" }}>1M+</div>
              <div className="text-xs" style={{ color: "#9b8e80" }}>{t("Interacciones IA/mes", "AI interactions/mo")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="relative z-10 max-w-[1200px] mx-auto px-7 py-16">
        <div className="flex justify-between items-end flex-wrap gap-5 mb-9">
          <div className="max-w-[560px]">
            <div className="font-mono2 text-xs tracking-[0.2em] mb-4" style={{ color: "#ff8a44" }}>
              {t("TODO EN UN SOLO LUGAR", "EVERYTHING IN ONE PLACE")}
            </div>
            <h2 className="font-grotesk font-semibold text-[clamp(28px,4.6vw,40px)] leading-[1.1] tracking-tight">
              {t("Una sola alianza para construir, automatizar y escalar.", "One partner to build, automate and scale.")}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div
              key={s.key}
              className={`rounded-[18px] p-6 border ${s.wide ? "sm:col-span-2 flex gap-5 items-start" : ""}`}
              style={
                s.accent
                  ? { background: "linear-gradient(140deg, rgba(255,122,46,.14), rgba(255,84,20,.05))", borderColor: "rgba(255,122,46,.24)" }
                  : { background: "rgba(22,17,12,.6)", borderColor: "rgba(255,255,255,.08)" }
              }
              data-testid={`service-card-${s.key}`}
            >
              <div
                className={`rounded-xl flex items-center justify-center ${s.wide ? "flex-none w-12 h-12" : "w-11 h-11 mb-[18px]"}`}
                style={{ background: s.accent ? "rgba(255,122,46,.2)" : "rgba(255,122,46,.12)" }}
              >
                <s.icon size={s.wide ? 24 : 22} style={{ color: "#ff8a44" }} strokeWidth={1.6} />
              </div>
              <div>
                <h3 className={`font-grotesk font-semibold ${s.wide ? "text-[21px] mb-2" : "text-lg mb-[7px]"}`}>
                  {lang === "es" ? s.name : s.nameEn || s.name}
                </h3>
                <p className={s.wide ? "text-[15px] leading-[1.55]" : "text-sm leading-relaxed"} style={{ color: s.wide || s.accent ? "#b6a99a" : "#9b8e80" }}>
                  {lang === "es" ? s.desc : s.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUCIONES */}
      <section id="soluciones" className="relative z-10 max-w-[1200px] mx-auto px-7 py-11">
        <div
          className="rounded-[22px] border border-white/[0.08] p-9 sm:p-11 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          style={{ background: "linear-gradient(120deg, rgba(255,84,20,.1), rgba(22,17,12,.4))" }}
        >
          <div>
            <h2 className="font-grotesk font-semibold text-[clamp(24px,3.6vw,32px)] leading-[1.12] tracking-tight mb-3.5">
              {t("De la idea al sistema funcionando, sin fricción.", "From idea to a working system, with zero friction.")}
            </h2>
            <p className="text-[15.5px] leading-[1.6]" style={{ color: "#b6a99a" }}>
              {t(
                "Diseñamos, integramos y mantenemos tu stack tecnológico para que tu equipo se enfoque en crecer.",
                "We design, integrate and maintain your tech stack so your team can focus on growing."
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl p-[18px]" style={{ background: "rgba(12,10,8,.45)", border: "1px solid rgba(255,255,255,.07)" }}>
                <div className="font-mono2 text-[13px] mb-1.5" style={{ color: "#ff8a44" }}>{s.n}</div>
                <div className="text-sm" style={{ color: "#cabcae" }}>{t(s.es, s.en)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios" className="relative z-10 max-w-[1200px] mx-auto px-7 py-14">
        <div className="text-center mb-10">
          <div className="font-mono2 text-xs tracking-[0.2em] mb-3.5" style={{ color: "#ff8a44" }}>
            {t("TESTIMONIOS", "TESTIMONIALS")}
          </div>
          <h2 className="font-grotesk font-semibold text-[clamp(26px,4.4vw,38px)] tracking-tight">
            {t("Negocios que crecen con nosotros.", "Businesses growing with us.")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((tm) => (
            <div key={tm.name} className="rounded-[18px] p-7 border border-white/[0.08]" style={{ background: "rgba(22,17,12,.6)" }}>
              <div className="font-serifItalic text-[46px] leading-[0.5] h-6" style={{ color: "#ff8a44" }}>&ldquo;</div>
              <p className="text-[15.5px] leading-[1.6] mb-[22px]" style={{ color: "#e3d8cb" }}>
                {t(tm.quote, tm.quoteEn)}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-grotesk font-bold"
                  style={{ background: tm.grad, color: tm.color }}
                >
                  {tm.initials}
                </span>
                <div>
                  <div className="font-semibold text-[14.5px]">{tm.name}</div>
                  <div className="text-[12.5px]" style={{ color: "#9b8e80" }}>{t(tm.role, tm.roleEn)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTO / CTA */}
      <section id="contacto" className="relative z-10 max-w-[1200px] mx-auto px-7 py-14 pb-6">
        <div
          className="rounded-[24px] border p-6 sm:p-11 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          style={{ borderColor: "rgba(255,122,46,.2)", background: "radial-gradient(120% 140% at 0% 0%, rgba(255,84,20,.14), rgba(22,17,12,.5))" }}
        >
          <div>
            <div className="font-mono2 text-xs tracking-[0.2em] mb-3.5" style={{ color: "#ff8a44" }}>
              {t("CONTACTO", "CONTACT")}
            </div>
            <h2 className="font-grotesk font-semibold text-[clamp(24px,4vw,36px)] leading-[1.1] tracking-tight mb-3.5">
              {t("Hablemos de tu próximo proyecto.", "Let's talk about your next project.")}
            </h2>
            <p className="text-[15.5px] leading-[1.6] mb-6" style={{ color: "#b6a99a" }}>
              {t("Cuéntanos qué necesitas y te respondemos en menos de 24 horas.", "Tell us what you need and we reply in under 24 hours.")}
            </p>
            <div className="flex flex-col gap-3 text-[14.5px]" style={{ color: "#cabcae" }}>
              <div className="flex items-center gap-2.5">
                <span style={{ color: "#ff8a44" }}>✉</span> contacto@innovagraf.com.gt
              </div>
              <div className="flex items-center gap-2.5">
                <span style={{ color: "#ff8a44" }}>●</span> {t("Lun – Vie · 9:00 a 18:00", "Mon – Fri · 9:00 to 18:00")}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 sm:p-9 text-center border"
            style={{ background: "rgba(12,10,8,.5)", borderColor: "rgba(255,122,46,.3)" }}
          >
            <h3 className="font-grotesk font-semibold text-[22px] mb-2">
              {t("¿Listo para tu diagnóstico?", "Ready for your diagnosis?")}
            </h3>
            <p className="text-[14.5px] mb-7" style={{ color: "#b6a99a" }}>
              {t(
                "Menos de 5 minutos. Recibe un plan personalizado con IA y propuesta detallada.",
                "Under 5 minutes. Get an AI-personalized plan and a detailed proposal."
              )}
            </p>
            <Link to="/diagnostico" data-testid="bottom-cta">
              <Button
                className="rounded-full px-4 sm:px-8 h-auto min-h-[52px] py-3 text-[15px] sm:text-base font-bold border-none w-full sm:w-auto"
                style={{ background: "linear-gradient(140deg,#ff7a2e,#ff5414)", color: "#160a04", boxShadow: "0 12px 30px rgba(255,84,20,.3)" }}
              >
                <span className="whitespace-normal leading-snug">{t("Iniciar diagnóstico gratis", "Start free diagnosis")}</span>
                <ArrowRight size={18} className="ml-1 shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.07] mt-6">
        <div className="max-w-[1200px] mx-auto px-7 py-10 flex justify-between flex-wrap gap-6 items-center">
          <span className="flex items-center bg-white rounded-lg px-[11px] py-1.5">
            <img src={logo} alt="Innovagraf" className="h-9 w-auto" />
          </span>
          <div className="text-[13.5px]" style={{ color: "#9b8e80" }}>
            {t("Software, automatización e inteligencia artificial para tu negocio.", "Software, automation and AI for your business.")}
          </div>
          <div className="font-mono2 text-xs" style={{ color: "#7c7065" }}>
            © {new Date().getFullYear()} Innovagraf
          </div>
        </div>
      </footer>
    </div>
  );
}
