"""Innovagraf Growth System — FastAPI backend."""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Response
from starlette.middleware.cors import CORSMiddleware

import models  # noqa: E402  (ensure env loaded first)
from auth import (  # noqa: E402
    create_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from database import client, db  # noqa: E402
from diagnostic_engine import (  # noqa: E402
    QUESTIONS,
    SERVICE_CATALOG,
    compute_scores,
    estimate_lead_value,
    recommend_services,
)
from ai_service import generate_diagnostic_summary, generate_proposal_content  # noqa: E402
from pdf_service import build_proposal_pdf  # noqa: E402
from models import (  # noqa: E402
    Diagnostic,
    DiagnosticSubmit,
    Lead,
    LeadActivity,
    LeadCreate,
    LeadNote,
    LeadUpdate,
    LoginRequest,
    Meeting,
    MeetingCreate,
    MeetingUpdate,
    NoteCreate,
    Proposal,
    ProposalGenerateRequest,
    ProposalItem,
    ProposalPhase,
    ProposalUpdate,
    Service,
    ServiceCreate,
    ServiceUpdate,
    SignupRequest,
    TokenResponse,
    User,
    UserCreate,
    UserPublic,
    UserUpdate,
    Workspace,
    WorkspaceCreate,
    WorkspacePublic,
    LEAD_STATUSES,
)

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("innovagraf")

app = FastAPI(title="Innovagraf Growth System API")
api = APIRouter(prefix="/api")

DEFAULT_WORKSPACE_SLUG = "innovagraf"


async def _get_workspace_by_id(workspace_id: str) -> Workspace | None:
    if not workspace_id:
        return None
    doc = await db.workspaces.find_one({"id": workspace_id})
    return Workspace.from_mongo(doc)


async def _get_workspace_by_slug(slug: str) -> Workspace | None:
    doc = await db.workspaces.find_one({"slug": slug.lower()})
    return Workspace.from_mongo(doc)


async def _workspace_public(workspace_id: str) -> WorkspacePublic | None:
    ws = await _get_workspace_by_id(workspace_id)
    if not ws:
        return None
    return WorkspacePublic(id=ws.id, slug=ws.slug, name=ws.name, plan=ws.plan)


async def to_public(user: User) -> UserPublic:
    ws = await _workspace_public(user.workspace_id) if user.workspace_id else None
    return UserPublic(
        id=user.id, email=user.email, name=user.name,
        role=user.role, active=user.active, created_at=user.created_at,
        workspace_id=user.workspace_id, workspace=ws,
    )


def ws_filter(user: User, extra: dict | None = None) -> dict:
    """Filter dict scoped to the user's workspace."""
    f: dict = {"workspace_id": user.workspace_id}
    if extra:
        f.update(extra)
    return f


# ---------------------------------------------------------------------------
# Startup: seed default admin + default services
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup() -> None:
    # default workspace
    ws_doc = await db.workspaces.find_one({"slug": DEFAULT_WORKSPACE_SLUG})
    if not ws_doc:
        ws = Workspace(
            slug=DEFAULT_WORKSPACE_SLUG,
            name="Innovagraf",
            plan="enterprise",
        )
        await db.workspaces.insert_one(ws.to_mongo())
        default_ws_id = ws.id
        logger.info("Seeded default workspace 'innovagraf'")
    else:
        default_ws_id = ws_doc["id"]

    # default admin
    admin = await db.users.find_one({"email": "admin@innovagraf.com"})
    if not admin:
        u = User(
            email="admin@innovagraf.com",
            name="Administrador Innovagraf",
            role="super_admin",
            password_hash=hash_password("Innovagraf2026!"),
            active=True,
            workspace_id=default_ws_id,
        )
        await db.users.insert_one(u.to_mongo())
        logger.info("Seeded default admin user")

    sales = await db.users.find_one({"email": "ventas@innovagraf.com"})
    if not sales:
        u = User(
            email="ventas@innovagraf.com",
            name="Ejecutivo Comercial",
            role="comercial",
            password_hash=hash_password("Ventas2026!"),
            active=True,
            workspace_id=default_ws_id,
        )
        await db.users.insert_one(u.to_mongo())
        logger.info("Seeded default sales user")

    # default services
    if await db.services.count_documents({"workspace_id": default_ws_id}) == 0:
        for name, info in SERVICE_CATALOG.items():
            svc = Service(
                code=name.lower().replace(" ", "_"),
                name=name,
                category=info["category"],
                description=info["description"],
                base_price=info["base_price"],
                workspace_id=default_ws_id,
            )
            await db.services.insert_one(svc.to_mongo())
        logger.info("Seeded default service catalog")

    # backfill: assign default workspace_id to any orphan docs (multi-tenant migration)
    for coll in ("users", "leads", "diagnostics", "meetings", "proposals", "services"):
        res = await db[coll].update_many(
            {"$or": [{"workspace_id": {"$exists": False}}, {"workspace_id": ""}, {"workspace_id": None}]},
            {"$set": {"workspace_id": default_ws_id}},
        )
        if res.modified_count:
            logger.info("Migrated %s docs in %s to default workspace", res.modified_count, coll)


@app.on_event("shutdown")
async def shutdown() -> None:
    client.close()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"service": "Innovagraf Growth System", "status": "ok"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    doc = await db.users.find_one({"email": payload.email.lower()})
    user = User.from_mongo(doc)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    token = create_token(user.id, user.role)
    return TokenResponse(token=token, user=await to_public(user))


@api.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest):
    slug = payload.workspace_slug.lower()
    if await db.workspaces.find_one({"slug": slug}):
        raise HTTPException(status_code=400, detail="El slug ya está en uso")
    if await db.users.find_one({"email": payload.admin_email.lower()}):
        raise HTTPException(status_code=400, detail="Email ya registrado")

    ws = Workspace(slug=slug, name=payload.workspace_name, plan="starter")
    await db.workspaces.insert_one(ws.to_mongo())

    user = User(
        email=payload.admin_email.lower(),
        name=payload.admin_name,
        role="admin",
        password_hash=hash_password(payload.admin_password),
        active=True,
        workspace_id=ws.id,
    )
    await db.users.insert_one(user.to_mongo())

    # update workspace owner
    await db.workspaces.update_one({"id": ws.id}, {"$set": {"owner_id": user.id}})

    # seed services for new workspace
    for name, info in SERVICE_CATALOG.items():
        svc = Service(
            code=name.lower().replace(" ", "_"),
            name=name,
            category=info["category"],
            description=info["description"],
            base_price=info["base_price"],
            workspace_id=ws.id,
        )
        await db.services.insert_one(svc.to_mongo())

    token = create_token(user.id, user.role)
    return TokenResponse(token=token, user=await to_public(user))


@api.get("/auth/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)):
    return await to_public(user)


@api.get("/workspaces/me", response_model=WorkspacePublic)
async def my_workspace(user: User = Depends(get_current_user)):
    ws = await _get_workspace_by_id(user.workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace no encontrado")
    return WorkspacePublic(id=ws.id, slug=ws.slug, name=ws.name, plan=ws.plan)


# ---------------------------------------------------------------------------
# Admin: users
# ---------------------------------------------------------------------------
@api.get("/admin/users", response_model=list[UserPublic])
async def list_users(current: User = Depends(require_admin)):
    docs = await db.users.find(ws_filter(current), {"_id": 0}).to_list(500)
    return [await to_public(User.from_mongo(d)) for d in docs]


@api.post("/admin/users", response_model=UserPublic)
async def create_user(payload: UserCreate, current: User = Depends(require_admin)):
    if await db.users.find_one({"email": payload.email.lower()}):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if payload.role == "super_admin":
        raise HTTPException(status_code=400, detail="Rol no permitido")
    u = User(
        email=payload.email.lower(),
        name=payload.name,
        role=payload.role,
        password_hash=hash_password(payload.password),
        workspace_id=current.workspace_id,
    )
    await db.users.insert_one(u.to_mongo())
    return await to_public(u)


@api.patch("/admin/users/{user_id}", response_model=UserPublic)
async def update_user(user_id: str, payload: UserUpdate, current: User = Depends(require_admin)):
    doc = await db.users.find_one(ws_filter(current, {"id": user_id}))
    user = User.from_mongo(doc)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    upd = payload.model_dump(exclude_none=True)
    if upd.get("role") == "super_admin":
        raise HTTPException(status_code=400, detail="Rol no permitido")
    if "password" in upd:
        upd["password_hash"] = hash_password(upd.pop("password"))
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user_id}, {"$set": upd})
    doc = await db.users.find_one({"id": user_id})
    return await to_public(User.from_mongo(doc))


@api.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current: User = Depends(require_admin)):
    if user_id == current.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    res = await db.users.delete_one(ws_filter(current, {"id": user_id}))
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Diagnostic - public endpoints (anonymous form submission)
# ---------------------------------------------------------------------------
@api.get("/diagnostic/questions")
async def diagnostic_questions():
    steps = sorted({q["step"] for q in QUESTIONS})
    return {
        "steps": [
            {
                "step": s,
                "title": {
                    1: "Tu empresa",
                    2: "Presencia digital",
                    3: "Procesos y herramientas",
                    4: "Atención al cliente",
                    5: "Marketing y ventas",
                }.get(s, f"Paso {s}"),
                "questions": [q for q in QUESTIONS if q["step"] == s],
            }
            for s in steps
        ],
        "total_steps": len(steps) + 1,  # +1 for contact step on the frontend
    }


@api.post("/diagnostic/submit")
async def diagnostic_submit(payload: DiagnosticSubmit, workspace: str | None = None):
    slug = (workspace or DEFAULT_WORKSPACE_SLUG).lower()
    ws = await _get_workspace_by_slug(slug)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace no encontrado")
    workspace_id = ws.id

    answers_dicts = [a.model_dump() for a in payload.answers]
    scores, maturity = compute_scores(answers_dicts)
    recos = recommend_services(answers_dicts, scores)
    estimated_value = estimate_lead_value(recos)

    summary = await generate_diagnostic_summary(
        company_name=payload.company_name,
        industry=payload.industry,
        company_size=payload.company_size,
        scores=scores,
        maturity=maturity,
        recommendations=recos,
    )

    # Create or update a lead by email (scoped to workspace)
    existing_doc = await db.leads.find_one({
        "workspace_id": workspace_id,
        "contact_email": payload.contact_email.lower(),
    })
    if existing_doc:
        lead = Lead.from_mongo(existing_doc)
        lead.company_name = payload.company_name
        lead.contact_name = payload.contact_name
        lead.contact_phone = payload.contact_phone or lead.contact_phone
        lead.contact_role = payload.contact_role or lead.contact_role
        lead.industry = payload.industry or lead.industry
        lead.company_size = payload.company_size or lead.company_size
        lead.maturity_score = maturity
        lead.estimated_value = estimated_value
        lead.requested_services = [r["service"] for r in recos]
        if lead.status == "nuevo":
            lead.status = "diagnostico_completo"
        lead.activities.append(LeadActivity(
            type="diagnostic",
            description=f"Diagnóstico actualizado. Madurez: {maturity}%",
        ))
        lead.updated_at = datetime.now(timezone.utc)
        await db.leads.replace_one({"id": lead.id}, lead.to_mongo())
    else:
        lead = Lead(
            workspace_id=workspace_id,
            company_name=payload.company_name,
            contact_name=payload.contact_name,
            contact_email=payload.contact_email.lower(),
            contact_phone=payload.contact_phone,
            contact_role=payload.contact_role,
            industry=payload.industry,
            company_size=payload.company_size,
            status="diagnostico_completo",
            source="diagnostic",
            estimated_value=estimated_value,
            maturity_score=maturity,
            requested_services=[r["service"] for r in recos],
            activities=[LeadActivity(
                type="diagnostic",
                description=f"Diagnóstico completado. Madurez: {maturity}%",
            )],
        )
        await db.leads.insert_one(lead.to_mongo())

    diag = Diagnostic(
        workspace_id=workspace_id,
        company_name=payload.company_name,
        industry=payload.industry,
        company_size=payload.company_size,
        contact_name=payload.contact_name,
        contact_email=payload.contact_email.lower(),
        contact_phone=payload.contact_phone,
        contact_role=payload.contact_role,
        answers=payload.answers,
        scores=scores,
        maturity_score=maturity,
        recommendations=recos,
        ai_summary=summary,
        lead_id=lead.id,
        completed=True,
    )
    await db.diagnostics.insert_one(diag.to_mongo())

    # link lead
    await db.leads.update_one({"id": lead.id}, {"$set": {"diagnostic_id": diag.id}})

    return {
        "diagnostic_id": diag.id,
        "lead_id": lead.id,
        "workspace_slug": slug,
        "scores": scores,
        "maturity_score": maturity,
        "recommendations": recos,
        "ai_summary": summary,
        "estimated_value": estimated_value,
    }


@api.get("/diagnostic/{diagnostic_id}")
async def get_diagnostic(diagnostic_id: str):
    doc = await db.diagnostics.find_one({"id": diagnostic_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    return doc


# ---------------------------------------------------------------------------
# CRM Leads
# ---------------------------------------------------------------------------
@api.get("/leads")
async def list_leads(status: Optional[str] = None, user: User = Depends(get_current_user)):
    q = ws_filter(user)
    if status:
        q["status"] = status
    docs = await db.leads.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.get("/leads/kanban")
async def kanban(user: User = Depends(get_current_user)):
    docs = await db.leads.find(ws_filter(user), {"_id": 0}).sort("created_at", -1).to_list(2000)
    grouped = {s: [] for s in LEAD_STATUSES}
    for d in docs:
        s = d.get("status", "nuevo")
        if s in grouped:
            grouped[s].append(d)
    return {"columns": grouped, "statuses": LEAD_STATUSES}


@api.post("/leads")
async def create_lead(payload: LeadCreate, user: User = Depends(get_current_user)):
    if payload.status not in LEAD_STATUSES:
        raise HTTPException(status_code=400, detail="Estado inválido")
    lead = Lead(
        **payload.model_dump(),
        owner_id=user.id,
        workspace_id=user.workspace_id,
        activities=[LeadActivity(type="status_change",
                                 description=f"Lead creado por {user.name}")],
    )
    await db.leads.insert_one(lead.to_mongo())
    return lead.model_dump()


@api.get("/leads/{lead_id}")
async def get_lead(lead_id: str, user: User = Depends(get_current_user)):
    doc = await db.leads.find_one(ws_filter(user, {"id": lead_id}), {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return doc


@api.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, payload: LeadUpdate, user: User = Depends(get_current_user)):
    doc = await db.leads.find_one(ws_filter(user, {"id": lead_id}))
    lead = Lead.from_mongo(doc)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    upd = payload.model_dump(exclude_none=True)
    if "status" in upd and upd["status"] != lead.status:
        if upd["status"] not in LEAD_STATUSES:
            raise HTTPException(status_code=400, detail="Estado inválido")
        lead.activities.append(LeadActivity(
            type="status_change",
            description=f"{user.name} cambió estado de {lead.status} a {upd['status']}",
        ))
    for k, v in upd.items():
        setattr(lead, k, v)
    lead.updated_at = datetime.now(timezone.utc)
    await db.leads.replace_one({"id": lead.id}, lead.to_mongo())
    return lead.model_dump()


@api.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: User = Depends(require_admin)):
    res = await db.leads.delete_one(ws_filter(user, {"id": lead_id}))
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return {"deleted": True}


@api.post("/leads/{lead_id}/notes")
async def add_note(lead_id: str, payload: NoteCreate, user: User = Depends(get_current_user)):
    doc = await db.leads.find_one(ws_filter(user, {"id": lead_id}))
    lead = Lead.from_mongo(doc)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    note = LeadNote(author_id=user.id, author_name=user.name, text=payload.text)
    lead.notes.append(note)
    lead.activities.append(LeadActivity(type="note", description=f"{user.name} agregó una nota"))
    lead.updated_at = datetime.now(timezone.utc)
    await db.leads.replace_one({"id": lead.id}, lead.to_mongo())
    return note.model_dump()


# ---------------------------------------------------------------------------
# Meetings
# ---------------------------------------------------------------------------
@api.get("/meetings")
async def list_meetings(lead_id: Optional[str] = None, user: User = Depends(get_current_user)):
    q = ws_filter(user)
    if lead_id:
        q["lead_id"] = lead_id
    docs = await db.meetings.find(q, {"_id": 0}).sort("scheduled_at", 1).to_list(1000)
    return docs


@api.post("/meetings")
async def create_meeting(payload: MeetingCreate, user: User = Depends(get_current_user)):
    lead_doc = await db.leads.find_one(ws_filter(user, {"id": payload.lead_id}))
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    m = Meeting(**payload.model_dump(), owner_id=user.id, workspace_id=user.workspace_id)
    await db.meetings.insert_one(m.to_mongo())
    # mark lead as reunion_agendada
    lead = Lead.from_mongo(lead_doc)
    if lead.status in ("nuevo", "contactado", "diagnostico_completo"):
        lead.status = "reunion_agendada"
    lead.activities.append(LeadActivity(
        type="meeting",
        description=f"{user.name} agendó reunión para {m.scheduled_at.isoformat()}",
    ))
    lead.updated_at = datetime.now(timezone.utc)
    await db.leads.replace_one({"id": lead.id}, lead.to_mongo())
    return m.model_dump()


@api.patch("/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, payload: MeetingUpdate, user: User = Depends(get_current_user)):
    doc = await db.meetings.find_one(ws_filter(user, {"id": meeting_id}))
    m = Meeting.from_mongo(doc)
    if not m:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    upd = payload.model_dump(exclude_none=True)
    for k, v in upd.items():
        setattr(m, k, v)
    m.updated_at = datetime.now(timezone.utc)
    await db.meetings.replace_one({"id": m.id}, m.to_mongo())
    return m.model_dump()


@api.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, user: User = Depends(get_current_user)):
    res = await db.meetings.delete_one(ws_filter(user, {"id": meeting_id}))
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------
def _compute_totals(items: list[ProposalItem], tax_rate: float) -> tuple[float, float, float]:
    for it in items:
        it.total = round(it.quantity * it.unit_price, 2)
    subtotal = round(sum(i.total for i in items), 2)
    tax = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax, 2)
    return subtotal, tax, total


@api.get("/proposals")
async def list_proposals(lead_id: Optional[str] = None, user: User = Depends(get_current_user)):
    q = ws_filter(user)
    if lead_id:
        q["lead_id"] = lead_id
    docs = await db.proposals.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/proposals/generate")
async def generate_proposal(payload: ProposalGenerateRequest, user: User = Depends(get_current_user)):
    lead_doc = await db.leads.find_one(ws_filter(user, {"id": payload.lead_id}))
    lead = Lead.from_mongo(lead_doc)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    # workspace-scoped catalog (fallback to default catalog if empty)
    svc_docs = await db.services.find(ws_filter(user), {"_id": 0}).to_list(200)
    if svc_docs:
        catalog = [
            {"name": s["name"], "category": s["category"],
             "base_price": s.get("base_price", 0), "description": s.get("description", "")}
            for s in svc_docs
        ]
    else:
        catalog = [
            {"name": name, "category": info["category"], "base_price": info["base_price"],
             "description": info["description"]}
            for name, info in SERVICE_CATALOG.items()
        ]
    content = await generate_proposal_content(
        company_name=lead.company_name,
        industry=lead.industry,
        services=payload.services,
        notes=payload.notes or "",
        services_catalog=catalog,
    )
    items = [ProposalItem(**it) for it in content.get("items", [])]
    phases = [ProposalPhase(**p) for p in content.get("phases", [])]
    subtotal, tax, total = _compute_totals(items, 0.12)
    proposal = Proposal(
        workspace_id=user.workspace_id,
        lead_id=lead.id,
        title=content.get("title") or f"Propuesta {lead.company_name}",
        summary=content.get("summary"),
        scope=content.get("scope"),
        objectives=content.get("objectives", []),
        items=items,
        phases=phases,
        subtotal=subtotal,
        tax=tax,
        total=total,
        currency="USD",
        generated_by_ai=True,
        status="draft",
    )
    await db.proposals.insert_one(proposal.to_mongo())

    lead.activities.append(LeadActivity(
        type="proposal", description=f"Propuesta generada por IA: {proposal.title}",
    ))
    lead.updated_at = datetime.now(timezone.utc)
    await db.leads.replace_one({"id": lead.id}, lead.to_mongo())
    return proposal.model_dump()


@api.get("/proposals/{proposal_id}")
async def get_proposal(proposal_id: str, user: User = Depends(get_current_user)):
    doc = await db.proposals.find_one(ws_filter(user, {"id": proposal_id}), {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")
    return doc


@api.patch("/proposals/{proposal_id}")
async def update_proposal(proposal_id: str, payload: ProposalUpdate, user: User = Depends(get_current_user)):
    doc = await db.proposals.find_one(ws_filter(user, {"id": proposal_id}))
    proposal = Proposal.from_mongo(doc)
    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")
    upd = payload.model_dump(exclude_none=True)
    for k, v in upd.items():
        if k == "items":
            proposal.items = [ProposalItem(**i) for i in v]
        elif k == "phases":
            proposal.phases = [ProposalPhase(**p) for p in v]
        else:
            setattr(proposal, k, v)
    subtotal, tax, total = _compute_totals(proposal.items, proposal.tax_rate)
    proposal.subtotal, proposal.tax, proposal.total = subtotal, tax, total
    proposal.updated_at = datetime.now(timezone.utc)
    await db.proposals.replace_one({"id": proposal.id}, proposal.to_mongo())

    # if marked as sent → update lead
    if upd.get("status") == "sent":
        lead_doc = await db.leads.find_one(ws_filter(user, {"id": proposal.lead_id}))
        lead = Lead.from_mongo(lead_doc)
        if lead and lead.status not in ("ganado", "perdido"):
            lead.status = "propuesta_enviada"
            lead.activities.append(LeadActivity(
                type="proposal", description=f"{user.name} envió la propuesta {proposal.title}",
            ))
            lead.updated_at = datetime.now(timezone.utc)
            await db.leads.replace_one({"id": lead.id}, lead.to_mongo())
    return proposal.model_dump()


@api.get("/proposals/{proposal_id}/pdf")
async def proposal_pdf(proposal_id: str, user: User = Depends(get_current_user)):
    doc = await db.proposals.find_one(ws_filter(user, {"id": proposal_id}), {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")
    lead_doc = await db.leads.find_one(ws_filter(user, {"id": doc["lead_id"]}), {"_id": 0}) or {}
    pdf = build_proposal_pdf(doc, lead_doc)
    filename = f"propuesta-{doc.get('title','propuesta').replace(' ', '_')}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Services (catalog)
# ---------------------------------------------------------------------------
@api.get("/services")
async def list_services(user: User = Depends(get_current_user)):
    docs = await db.services.find(ws_filter(user), {"_id": 0}).sort("name", 1).to_list(200)
    return docs


@api.post("/services")
async def create_service(payload: ServiceCreate, user: User = Depends(require_admin)):
    if await db.services.find_one(ws_filter(user, {"code": payload.code})):
        raise HTTPException(status_code=400, detail="Código ya existe")
    s = Service(**payload.model_dump(), workspace_id=user.workspace_id)
    await db.services.insert_one(s.to_mongo())
    return s.model_dump()


@api.patch("/services/{service_id}")
async def update_service(service_id: str, payload: ServiceUpdate, user: User = Depends(require_admin)):
    doc = await db.services.find_one(ws_filter(user, {"id": service_id}))
    if not doc:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    upd = payload.model_dump(exclude_none=True)
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.services.update_one({"id": service_id}, {"$set": upd})
    doc = await db.services.find_one({"id": service_id}, {"_id": 0})
    return doc


@api.delete("/services/{service_id}")
async def delete_service(service_id: str, user: User = Depends(require_admin)):
    res = await db.services.delete_one(ws_filter(user, {"id": service_id}))
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Dashboard analytics
# ---------------------------------------------------------------------------
@api.get("/dashboard/overview")
async def dashboard_overview(user: User = Depends(get_current_user)):
    leads = await db.leads.find(ws_filter(user), {"_id": 0}).to_list(5000)
    total_leads = len(leads)
    won = sum(1 for ld in leads if ld.get("status") == "ganado")
    lost = sum(1 for ld in leads if ld.get("status") == "perdido")
    closed = won + lost
    conversion_rate = round((won / closed) * 100, 1) if closed else 0.0
    pipeline_value = round(sum(
        ld.get("estimated_value", 0) for ld in leads
        if ld.get("status") not in ("ganado", "perdido")
    ), 2)
    won_value = round(sum(ld.get("estimated_value", 0) for ld in leads if ld.get("status") == "ganado"), 2)

    # funnel
    funnel = []
    for s in LEAD_STATUSES:
        funnel.append({
            "status": s,
            "count": sum(1 for ld in leads if ld.get("status") == s),
        })

    # services demand
    svc_count: dict[str, int] = {}
    for ld in leads:
        for svc in ld.get("requested_services", []) or []:
            svc_count[svc] = svc_count.get(svc, 0) + 1
    services_demand = sorted(
        [{"service": k, "count": v} for k, v in svc_count.items()],
        key=lambda x: -x["count"],
    )

    # leads per month (last 6 months)
    from collections import OrderedDict
    months: "OrderedDict[str, int]" = OrderedDict()
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year + (now.month - i - 1) // 12
        months[f"{y}-{m:02d}"] = 0
    for ld in leads:
        ts = ld.get("created_at")
        if isinstance(ts, str):
            try:
                dt = datetime.fromisoformat(ts)
                key = f"{dt.year}-{dt.month:02d}"
                if key in months:
                    months[key] += 1
            except ValueError:
                pass
    trend = [{"month": k, "count": v} for k, v in months.items()]

    avg_maturity = round(
        sum(ld.get("maturity_score", 0) for ld in leads) / total_leads, 1
    ) if total_leads else 0.0

    return {
        "total_leads": total_leads,
        "conversion_rate": conversion_rate,
        "won_count": won,
        "lost_count": lost,
        "pipeline_value": pipeline_value,
        "won_value": won_value,
        "avg_maturity_score": avg_maturity,
        "funnel": funnel,
        "services_demand": services_demand,
        "leads_trend": trend,
    }


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
