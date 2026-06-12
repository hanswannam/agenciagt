"""LLM helpers for AI summary and AI proposal generation."""
from __future__ import annotations

import json
import os
import re
from typing import Any

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-6"


def _chat(session_id: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)


def _extract_json(text: str) -> dict | list | None:
    """Best-effort JSON extraction from an LLM response."""
    if not text:
        return None
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if fenced:
        text = fenced.group(1)
    try:
        return json.loads(text)
    except Exception:
        # try first {...} block
        m = re.search(r"\{[\s\S]+\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                return None
        return None


async def generate_diagnostic_summary(
    company_name: str,
    industry: str | None,
    company_size: str | None,
    scores: dict[str, float],
    maturity: float,
    recommendations: list[dict],
) -> str:
    """Return a short executive summary (2-3 paragraphs, Spanish)."""
    system = (
        "Eres un consultor senior en transformación digital de Innovagraf. "
        "Escribes resúmenes ejecutivos claros, accionables y profesionales en español neutro. "
        "Tono cercano y consultivo. Sin emojis. Máximo 3 párrafos cortos."
    )
    payload = {
        "empresa": company_name,
        "industria": industry,
        "tamano": company_size,
        "puntajes_por_area": scores,
        "madurez_digital_total": maturity,
        "recomendaciones_priorizadas": [
            {"servicio": r["service"], "prioridad": r["priority"], "razon": r["reason"]}
            for r in recommendations
        ],
    }
    prompt = (
        "A partir del siguiente diagnóstico, redacta un resumen ejecutivo personalizado para el cliente. "
        "Estructura: 1) Diagnóstico actual, 2) Oportunidades clave, 3) Próximos pasos recomendados.\n\n"
        f"Diagnóstico:\n{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )
    try:
        chat = _chat(f"diag-{company_name[:20]}", system)
        response = await chat.send_message(UserMessage(text=prompt))
        return (response or "").strip()
    except Exception as e:  # noqa: BLE001
        return (
            f"Resumen no disponible en este momento (error: {e}). "
            "Tu diagnóstico fue procesado correctamente y las recomendaciones están listas más abajo."
        )


async def generate_proposal_content(
    company_name: str,
    industry: str | None,
    services: list[str],
    notes: str,
    services_catalog: list[dict],
) -> dict[str, Any]:
    """Return structured proposal content: summary, scope, objectives, items, phases."""
    system = (
        "Eres un gerente comercial senior de Innovagraf especializado en propuestas B2B de servicios digitales "
        "(páginas web, CRM, chatbots, IA, automatización, ERP). Devuelves SIEMPRE un JSON válido en español, "
        "sin texto adicional, sin markdown, sin comentarios. Tono profesional y persuasivo."
    )
    schema = {
        "title": "string corto y atractivo",
        "summary": "2-3 oraciones de resumen ejecutivo",
        "scope": "párrafo describiendo alcance general",
        "objectives": ["3-5 objetivos accionables"],
        "items": [
            {
                "name": "Servicio",
                "description": "qué incluye",
                "quantity": 1,
                "unit_price": 0,
                "total": 0,
            }
        ],
        "phases": [
            {
                "name": "Fase",
                "duration_weeks": 2,
                "deliverables": ["entregable 1", "entregable 2"],
            }
        ],
    }
    prompt = (
        f"Empresa cliente: {company_name}\n"
        f"Industria: {industry or 'No especificada'}\n"
        f"Servicios solicitados: {', '.join(services)}\n"
        f"Notas adicionales: {notes or 'Ninguna'}\n\n"
        f"Catálogo de referencia (precios sugeridos USD):\n"
        f"{json.dumps(services_catalog, ensure_ascii=False)}\n\n"
        f"Genera una propuesta profesional. Items deben coincidir con los servicios solicitados, con precios "
        f"basados en el catálogo (puedes ajustar +/- 20%). Phases entre 1 y 4 fases.\n\n"
        f"Devuelve EXACTAMENTE este JSON (sin markdown):\n{json.dumps(schema, ensure_ascii=False)}"
    )
    try:
        chat = _chat(f"prop-{company_name[:20]}", system)
        response = await chat.send_message(UserMessage(text=prompt))
        data = _extract_json(response or "")
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Fallback structured content (rule-based)
    items = []
    phases = []
    for s in services:
        info = next((c for c in services_catalog if c["name"] == s), None)
        price = info["base_price"] if info else 1000
        desc = info["description"] if info else ""
        items.append({"name": s, "description": desc, "quantity": 1, "unit_price": price, "total": price})
    phases = [
        {"name": "Descubrimiento y planificación", "duration_weeks": 1,
         "deliverables": ["Reunión kickoff", "Plan de proyecto", "Definición de KPIs"]},
        {"name": "Diseño y desarrollo", "duration_weeks": 3,
         "deliverables": ["Prototipos", "Implementación", "Revisiones semanales"]},
        {"name": "Entrega y capacitación", "duration_weeks": 1,
         "deliverables": ["Lanzamiento", "Capacitación al equipo", "Documentación"]},
    ]
    return {
        "title": f"Propuesta {company_name} - {', '.join(services)}",
        "summary": f"Propuesta integral de {', '.join(services)} para {company_name}.",
        "scope": "Implementación end-to-end con acompañamiento estratégico de Innovagraf.",
        "objectives": [
            "Acelerar la transformación digital de la empresa",
            "Aumentar la conversión y eficiencia operativa",
            "Implementar las soluciones tecnológicas seleccionadas",
        ],
        "items": items,
        "phases": phases,
    }
