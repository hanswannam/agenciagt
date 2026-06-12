"""Diagnostic scoring + rule-based recommendation engine.

The engine analyses answers from the multi-step questionnaire and produces:
    - per-category scores (0..100): web, crm, automation, ai, marketing
    - overall maturity score
    - prioritised list of recommendations (Innovagraf services)
"""
from __future__ import annotations

from typing import Any

QUESTIONS = [
    # step 1 - empresa
    {"step": 1, "id": "industry", "label": "¿En qué industria opera tu empresa?", "type": "select",
     "options": ["Retail", "Servicios profesionales", "Restaurantes", "Educación",
                 "Salud", "Manufactura", "Tecnología", "Inmobiliaria", "Otro"], "required": True},
    {"step": 1, "id": "company_size", "label": "¿Cuántos empleados tiene tu empresa?", "type": "radio",
     "options": ["1-5", "6-20", "21-50", "51-200", "+200"], "required": True},
    {"step": 1, "id": "annual_revenue", "label": "Rango de facturación anual estimado", "type": "radio",
     "options": ["< $50K", "$50K - $250K", "$250K - $1M", "$1M - $5M", "> $5M"], "required": False},

    # step 2 - presencia digital
    {"step": 2, "id": "has_website", "label": "¿Cuentan con sitio web?", "type": "radio",
     "options": ["No", "Sí, básico", "Sí, profesional", "Sí, con e-commerce"], "category": "web"},
    {"step": 2, "id": "website_traffic", "label": "Tráfico mensual aproximado al sitio", "type": "radio",
     "options": ["No medimos", "< 500", "500-5,000", "5,000-50,000", "> 50,000"], "category": "web"},
    {"step": 2, "id": "social_presence", "label": "Plataformas digitales activas", "type": "checkbox",
     "options": ["Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube", "Google My Business"], "category": "marketing"},

    # step 3 - procesos
    {"step": 3, "id": "has_crm", "label": "¿Usan algún CRM para gestionar clientes?", "type": "radio",
     "options": ["No, usamos Excel/papel", "WhatsApp/correo", "CRM básico", "CRM avanzado"], "category": "crm"},
    {"step": 3, "id": "leads_per_month", "label": "¿Cuántos prospectos reciben al mes?", "type": "radio",
     "options": ["< 10", "10-50", "50-200", "200-1000", "> 1000"], "category": "crm"},
    {"step": 3, "id": "has_automation", "label": "¿Tienen procesos automatizados (correos, seguimiento, ventas)?", "type": "radio",
     "options": ["Nada automatizado", "Algunos correos", "Workflows básicos", "Automatización avanzada"], "category": "automation"},
    {"step": 3, "id": "has_erp", "label": "¿Cuentan con ERP / sistema integral de gestión?", "type": "radio",
     "options": ["No", "Hojas de cálculo", "Software puntual (facturación, inventario)", "ERP integrado"], "category": "automation"},

    # step 4 - atención al cliente
    {"step": 4, "id": "customer_channels", "label": "Canales de atención al cliente", "type": "checkbox",
     "options": ["WhatsApp", "Llamadas", "Email", "Redes sociales", "Web chat", "Presencial"], "category": "ai"},
    {"step": 4, "id": "support_volume", "label": "Volumen mensual de consultas/atención", "type": "radio",
     "options": ["< 100", "100-500", "500-2,000", "2,000-10,000", "> 10,000"], "category": "ai"},
    {"step": 4, "id": "has_chatbot", "label": "¿Usan chatbot o agente de IA?", "type": "radio",
     "options": ["No", "Respuestas automáticas básicas", "Chatbot con flujos", "Chatbot con IA"], "category": "ai"},

    # step 5 - marketing y ventas
    {"step": 5, "id": "marketing_investment", "label": "Inversión mensual en marketing digital", "type": "radio",
     "options": ["$0", "< $300", "$300-$1,500", "$1,500-$5,000", "> $5,000"], "category": "marketing"},
    {"step": 5, "id": "conversion_tracking", "label": "¿Miden conversiones y ROI?", "type": "radio",
     "options": ["No medimos", "Métricas básicas", "Analytics + KPIs", "Dashboards completos"], "category": "marketing"},
    {"step": 5, "id": "main_goal", "label": "Tu principal objetivo a corto plazo", "type": "radio",
     "options": ["Atraer más clientes", "Mejorar ventas/cierre", "Automatizar operación", "Reducir costos", "Lanzar nuevo producto"], "required": True},
    {"step": 5, "id": "interested_services", "label": "Servicios de interés", "type": "checkbox",
     "options": ["Página Web", "Landing Page", "CRM", "Chatbot IA", "Agente de Voz IA", "ERP", "Automatizaciones"], "required": False},
]

# answer index → points (0..5) by category
SCORE_MAP = {
    "has_website": [0, 2, 4, 5],
    "website_traffic": [0, 1, 2, 4, 5],
    "social_presence": "count_pct",  # special: number selected / total
    "has_crm": [0, 1, 3, 5],
    "leads_per_month": [1, 2, 3, 4, 5],
    "has_automation": [0, 2, 3, 5],
    "has_erp": [0, 1, 3, 5],
    "customer_channels": "count_pct",
    "support_volume": [1, 2, 3, 4, 5],
    "has_chatbot": [0, 2, 3, 5],
    "marketing_investment": [0, 1, 3, 4, 5],
    "conversion_tracking": [0, 2, 3, 5],
}

CATEGORIES = ["web", "crm", "automation", "ai", "marketing"]


def _get_option_index(question: dict, value: Any) -> int | None:
    opts = question.get("options", [])
    if value in opts:
        return opts.index(value)
    return None


def compute_scores(answers: list[dict]) -> tuple[dict[str, float], float]:
    """Return per-category 0..100 score and overall maturity."""
    answers_by_id = {a["question_id"]: a["value"] for a in answers}
    cat_totals: dict[str, list[float]] = {c: [] for c in CATEGORIES}

    for q in QUESTIONS:
        qid = q["id"]
        cat = q.get("category")
        if not cat or qid not in answers_by_id:
            continue
        value = answers_by_id[qid]
        rule = SCORE_MAP.get(qid)
        score = 0.0
        if rule == "count_pct":
            total = len(q["options"])
            chosen = len(value) if isinstance(value, list) else 0
            score = (chosen / total) * 5 if total else 0
        elif isinstance(rule, list):
            idx = _get_option_index(q, value)
            if idx is not None and idx < len(rule):
                score = float(rule[idx])
        # normalize to 0..100 per question (max 5)
        cat_totals[cat].append((score / 5.0) * 100.0)

    scores: dict[str, float] = {}
    for cat, vals in cat_totals.items():
        scores[cat] = round(sum(vals) / len(vals), 1) if vals else 0.0
    overall = round(sum(scores.values()) / len(scores), 1) if scores else 0.0
    return scores, overall


# ---------------------------------------------------------------------------
# Service catalogue (defaults). Used by recommendations.
# ---------------------------------------------------------------------------
SERVICE_CATALOG = {
    "Página Web": {
        "category": "web",
        "base_price": 1200,
        "description": "Sitio web profesional, responsive, optimizado SEO y de alta conversión.",
    },
    "Landing Page": {
        "category": "web",
        "base_price": 450,
        "description": "Landing page de alta conversión para campañas, lanzamientos o productos.",
    },
    "CRM": {
        "category": "crm",
        "base_price": 1800,
        "description": "Implementación de CRM a medida con pipeline, automatización y reportes.",
    },
    "Chatbot IA": {
        "category": "ai",
        "base_price": 950,
        "description": "Chatbot con IA conectado a WhatsApp/web para atender 24/7 y calificar leads.",
    },
    "Agente de Voz IA": {
        "category": "ai",
        "base_price": 1500,
        "description": "Asistente de voz con IA para llamadas entrantes, citas y soporte.",
    },
    "ERP": {
        "category": "automation",
        "base_price": 3500,
        "description": "ERP integrado para gestionar inventario, finanzas, ventas y operaciones.",
    },
    "Automatizaciones": {
        "category": "automation",
        "base_price": 800,
        "description": "Automatización de flujos comerciales, marketing y operativos (n8n / Make).",
    },
}


def recommend_services(answers: list[dict], scores: dict[str, float]) -> list[dict]:
    """Return prioritised list of recommendations."""
    ans = {a["question_id"]: a["value"] for a in answers}
    recos: list[dict] = []

    def add(name: str, reason: str, priority: int):
        info = SERVICE_CATALOG[name]
        recos.append({
            "service": name,
            "category": info["category"],
            "description": info["description"],
            "estimated_price": info["base_price"],
            "priority": priority,  # 1 high - 3 low
            "reason": reason,
        })

    has_website = ans.get("has_website", "No")
    if has_website in ("No", "Sí, básico"):
        add("Página Web", "Tu sitio web actual limita la captación de clientes y la credibilidad de tu marca.", 1)

    if ans.get("main_goal") == "Atraer más clientes" or scores.get("marketing", 0) < 40:
        add("Landing Page", "Una landing dedicada multiplica la conversión de campañas pagadas y orgánicas.", 2)

    has_crm = ans.get("has_crm", "")
    if has_crm in ("No, usamos Excel/papel", "WhatsApp/correo") or scores.get("crm", 0) < 50:
        add("CRM", "Sin un CRM estás perdiendo leads y trazabilidad comercial. Es la base para escalar.", 1)

    support_volume = ans.get("support_volume", "")
    has_chatbot = ans.get("has_chatbot", "")
    high_volume = support_volume in ("500-2,000", "2,000-10,000", "> 10,000")
    if (has_chatbot in ("No", "Respuestas automáticas básicas") and high_volume) or scores.get("ai", 0) < 40:
        add("Chatbot IA", "El volumen de consultas justifica un chatbot IA que atienda 24/7 y libere a tu equipo.", 1 if high_volume else 2)

    channels = ans.get("customer_channels", []) or []
    if "Llamadas" in channels and high_volume:
        add("Agente de Voz IA", "Recibes muchas llamadas: un agente de voz IA atiende, agenda y deriva sin contratar más personal.", 2)

    has_erp = ans.get("has_erp", "")
    company_size = ans.get("company_size", "")
    if has_erp in ("No", "Hojas de cálculo") and company_size in ("21-50", "51-200", "+200"):
        add("ERP", "Tu tamaño operativo requiere centralizar finanzas, inventario y ventas en un ERP integrado.", 2)

    has_automation = ans.get("has_automation", "")
    if has_automation in ("Nada automatizado", "Algunos correos") or scores.get("automation", 0) < 50:
        add("Automatizaciones", "Automatizar flujos repetitivos te ahorra horas y reduce errores humanos.", 2)

    interested = ans.get("interested_services", []) or []
    for s in interested:
        if not any(r["service"] == s for r in recos) and s in SERVICE_CATALOG:
            add(s, "Servicio marcado como de interés en tu diagnóstico.", 3)

    # de-duplicate keeping highest priority
    seen: dict[str, dict] = {}
    for r in recos:
        cur = seen.get(r["service"])
        if not cur or r["priority"] < cur["priority"]:
            seen[r["service"]] = r
    final = sorted(seen.values(), key=lambda x: x["priority"])
    return final


def estimate_lead_value(recommendations: list[dict]) -> float:
    return float(sum(r.get("estimated_price", 0) for r in recommendations))
