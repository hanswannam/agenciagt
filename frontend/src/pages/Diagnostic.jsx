import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const STORAGE_KEY = "innovagraf_diagnostic_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { answers: {}, contact: {} };
  } catch {
    return { answers: {}, contact: {} };
  }
}

function saveDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export default function Diagnostic() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [steps, setSteps] = useState([]);
  const [totalSteps, setTotalSteps] = useState(6);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/diagnostic/questions")
      .then((r) => {
        setSteps(r.data.steps);
        setTotalSteps(r.data.total_steps);
      })
      .catch(() => toast.error("No se pudo cargar el formulario"));
    const draft = loadDraft();
    setAnswers(draft.answers || {});
    setContact(draft.contact || {});
  }, []);

  useEffect(() => {
    saveDraft({ answers, contact });
  }, [answers, contact]);

  const setAnswer = (qid, value) => setAnswers((a) => ({ ...a, [qid]: value }));

  const stepData = steps.find((s) => s.step === currentStep);
  const isContactStep = currentStep === totalSteps;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const canAdvance = () => {
    if (isContactStep) {
      return contact.company_name && contact.contact_name && contact.contact_email;
    }
    if (!stepData) return false;
    for (const q of stepData.questions) {
      if (q.required && (answers[q.id] === undefined || answers[q.id] === "")) return false;
    }
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        company_name: contact.company_name,
        industry: answers.industry,
        company_size: answers.company_size,
        contact_name: contact.contact_name,
        contact_email: contact.contact_email,
        contact_phone: contact.contact_phone || null,
        contact_role: contact.contact_role || null,
        answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
      };
      const { data } = await api.post("/diagnostic/submit", payload, {
        params: slug ? { workspace: slug } : {},
      });
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Diagnóstico procesado", { description: "Revisa tus recomendaciones." });
      navigate(`/diagnostico/resultado/${data.diagnostic_id}`);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo enviar el diagnóstico");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" data-testid="diagnostic-logo">
            <img src={logo} alt="Innovagraf" className="h-8 w-auto" />
          </Link>
          <div className="text-sm text-brand-midnight/60" data-testid="diagnostic-step-indicator">
            Paso {currentStep} de {totalSteps}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Progress value={progress} className="h-2 bg-black/5" data-testid="diagnostic-progress" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {!isContactStep && stepData && (
              <>
                <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">
                  Paso {stepData.step}
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight mb-2">{stepData.title}</h1>
                <p className="text-brand-midnight/60 mb-10">
                  Responde con sinceridad. Solo tomará unos segundos.
                </p>
                <div className="space-y-8">
                  {stepData.questions.map((q) => (
                    <QuestionField
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onChange={(v) => setAnswer(q.id, v)}
                    />
                  ))}
                </div>
              </>
            )}

            {isContactStep && (
              <>
                <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold mb-3">
                  Último paso
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight mb-2">
                  ¿Dónde te enviamos tu plan?
                </h1>
                <p className="text-brand-midnight/60 mb-10">
                  Necesitamos tus datos para entregarte el diagnóstico y propuesta personalizada.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nombre de la empresa" required>
                    <Input
                      data-testid="contact-company-name"
                      value={contact.company_name || ""}
                      onChange={(e) => setContact({ ...contact, company_name: e.target.value })}
                      placeholder="Ej. Distribuidora Maya"
                    />
                  </Field>
                  <Field label="Tu nombre" required>
                    <Input
                      data-testid="contact-name"
                      value={contact.contact_name || ""}
                      onChange={(e) => setContact({ ...contact, contact_name: e.target.value })}
                      placeholder="Andrea Méndez"
                    />
                  </Field>
                  <Field label="Email" required>
                    <Input
                      data-testid="contact-email"
                      type="email"
                      value={contact.contact_email || ""}
                      onChange={(e) => setContact({ ...contact, contact_email: e.target.value })}
                      placeholder="andrea@empresa.com"
                    />
                  </Field>
                  <Field label="Teléfono / WhatsApp">
                    <Input
                      data-testid="contact-phone"
                      value={contact.contact_phone || ""}
                      onChange={(e) => setContact({ ...contact, contact_phone: e.target.value })}
                      placeholder="+502 0000 0000"
                    />
                  </Field>
                  <Field label="Cargo" className="sm:col-span-2">
                    <Input
                      data-testid="contact-role"
                      value={contact.contact_role || ""}
                      onChange={(e) => setContact({ ...contact, contact_role: e.target.value })}
                      placeholder="Gerente Comercial"
                    />
                  </Field>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            data-testid="diagnostic-prev-button"
            className="rounded-full"
          >
            <ArrowLeft size={16} className="mr-1" /> Anterior
          </Button>
          {!isContactStep ? (
            <Button
              disabled={!canAdvance()}
              onClick={() => setCurrentStep((s) => s + 1)}
              data-testid="diagnostic-next-button"
              className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-6"
            >
              Siguiente <ArrowRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button
              disabled={!canAdvance() || submitting}
              onClick={submit}
              data-testid="diagnostic-submit-button"
              className="bg-brand-orange hover:bg-brand-orangeDark text-white rounded-full px-6"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Procesando…
                </>
              ) : (
                <>
                  Ver mi plan <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, children, required, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs tracking-[0.15em] uppercase font-bold text-brand-midnight/70">
        {label} {required && <span className="text-brand-orange">*</span>}
      </Label>
      {children}
    </div>
  );
}

function QuestionField({ question, value, onChange }) {
  const { id, label, type, options, required } = question;
  return (
    <div data-testid={`question-${id}`}>
      <div className="font-semibold text-base mb-3 text-brand-midnight">
        {label} {required && <span className="text-brand-orange">*</span>}
      </div>
      {(type === "radio" || type === "select") && (
        <div className="grid sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                data-testid={`option-${id}-${opt.replace(/\s+/g, "_")}`}
                className={`text-left px-4 py-3 rounded-xl border transition text-sm ${
                  selected
                    ? "border-brand-orange bg-brand-orange/5 text-brand-midnight font-semibold"
                    : "border-black/10 bg-white hover:border-brand-orange/40"
                }`}
              >
                <span className={`inline-block w-3 h-3 rounded-full border mr-2 align-middle ${selected ? "bg-brand-orange border-brand-orange" : "border-black/20"}`} />
                {opt}
              </button>
            );
          })}
        </div>
      )}
      {type === "checkbox" && (
        <div className="grid sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const list = Array.isArray(value) ? value : [];
            const selected = list.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  onChange(selected ? list.filter((x) => x !== opt) : [...list, opt])
                }
                data-testid={`option-${id}-${opt.replace(/\s+/g, "_")}`}
                className={`text-left px-4 py-3 rounded-xl border transition text-sm ${
                  selected
                    ? "border-brand-orange bg-brand-orange/5 text-brand-midnight font-semibold"
                    : "border-black/10 bg-white hover:border-brand-orange/40"
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded border mr-2 align-middle ${selected ? "bg-brand-orange border-brand-orange" : "border-black/20"}`} />
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
