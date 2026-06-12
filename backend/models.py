"""Pydantic models for Innovagraf Growth System."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Base document
# ---------------------------------------------------------------------------
class BaseDocument(BaseModel):
    """Base for all Mongo documents. Uses UUID string ids (no ObjectId)."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(default_factory=new_id)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    def to_mongo(self) -> dict[str, Any]:
        doc = self.model_dump()
        # serialize datetimes to ISO strings
        for k, v in list(doc.items()):
            if isinstance(v, datetime):
                doc[k] = v.isoformat()
        return doc

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None):
        if not doc:
            return None
        doc = {k: v for k, v in doc.items() if k != "_id"}
        for k, v in list(doc.items()):
            if k in ("created_at", "updated_at") and isinstance(v, str):
                try:
                    doc[k] = datetime.fromisoformat(v)
                except ValueError:
                    pass
        return cls(**doc)


# ---------------------------------------------------------------------------
# Workspace (tenant)
# ---------------------------------------------------------------------------
class Workspace(BaseDocument):
    slug: str
    name: str
    owner_id: Optional[str] = None
    plan: str = "starter"  # starter | pro | enterprise
    status: str = "active"  # active | suspended
    settings: dict[str, Any] = Field(default_factory=dict)


class WorkspaceCreate(BaseModel):
    name: str
    slug: str


class WorkspacePublic(BaseModel):
    id: str
    slug: str
    name: str
    plan: str
    status: str = "active"


class WorkspaceAdminUpdate(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    name: Optional[str] = None


# ---------------------------------------------------------------------------
# Users / Auth
# ---------------------------------------------------------------------------
class User(BaseDocument):
    email: EmailStr
    name: str
    role: str = "comercial"  # super_admin | admin | comercial
    password_hash: str
    active: bool = True
    workspace_id: str = ""


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    active: bool
    workspace_id: str = ""
    workspace: Optional[WorkspacePublic] = None
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "comercial"
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    workspace_name: str = Field(min_length=2)
    workspace_slug: str = Field(min_length=2, pattern=r"^[a-z0-9-]+$")
    admin_name: str
    admin_email: EmailStr
    admin_password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    token: str
    user: UserPublic


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------
class DiagnosticAnswer(BaseModel):
    question_id: str
    value: Any  # string, list[str], number


class Diagnostic(BaseDocument):
    workspace_id: str = ""
    company_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    answers: list[DiagnosticAnswer] = Field(default_factory=list)
    scores: dict[str, float] = Field(default_factory=dict)  # category -> 0..100
    maturity_score: float = 0.0  # overall 0..100
    recommendations: list[dict[str, Any]] = Field(default_factory=list)
    ai_summary: Optional[str] = None
    lead_id: Optional[str] = None
    completed: bool = False


class DiagnosticDraftCreate(BaseModel):
    answers: list[DiagnosticAnswer] = Field(default_factory=list)
    company_name: Optional[str] = ""
    industry: Optional[str] = None
    company_size: Optional[str] = None
    contact_name: Optional[str] = ""
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None


class DiagnosticSubmit(BaseModel):
    company_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    answers: list[DiagnosticAnswer]


# ---------------------------------------------------------------------------
# CRM Leads
# ---------------------------------------------------------------------------
LEAD_STATUSES = [
    "nuevo",
    "contactado",
    "diagnostico_completo",
    "reunion_agendada",
    "propuesta_enviada",
    "negociacion",
    "ganado",
    "perdido",
]


class LeadNote(BaseModel):
    id: str = Field(default_factory=new_id)
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    text: str
    created_at: datetime = Field(default_factory=utc_now)


class LeadActivity(BaseModel):
    id: str = Field(default_factory=new_id)
    type: str  # status_change | note | diagnostic | meeting | proposal
    description: str
    created_at: datetime = Field(default_factory=utc_now)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Lead(BaseDocument):
    workspace_id: str = ""
    company_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: str = "nuevo"
    source: str = "diagnostic"  # diagnostic | manual | landing
    estimated_value: float = 0.0
    maturity_score: float = 0.0
    requested_services: list[str] = Field(default_factory=list)
    owner_id: Optional[str] = None
    diagnostic_id: Optional[str] = None
    notes: list[LeadNote] = Field(default_factory=list)
    activities: list[LeadActivity] = Field(default_factory=list)


class LeadCreate(BaseModel):
    company_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: str = "nuevo"
    estimated_value: float = 0.0
    requested_services: list[str] = Field(default_factory=list)


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    contact_role: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: Optional[str] = None
    estimated_value: Optional[float] = None
    requested_services: Optional[list[str]] = None
    owner_id: Optional[str] = None


class NoteCreate(BaseModel):
    text: str


# ---------------------------------------------------------------------------
# Meetings
# ---------------------------------------------------------------------------
class Meeting(BaseDocument):
    workspace_id: str = ""
    lead_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    duration_min: int = 30
    location: str = "Videollamada"
    status: str = "scheduled"  # scheduled | completed | cancelled
    owner_id: Optional[str] = None
    attendees: list[str] = Field(default_factory=list)


class MeetingCreate(BaseModel):
    lead_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    duration_min: int = 30
    location: str = "Videollamada"
    attendees: list[str] = Field(default_factory=list)


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_min: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------
class ProposalItem(BaseModel):
    name: str
    description: Optional[str] = ""
    quantity: float = 1
    unit_price: float = 0.0
    total: float = 0.0


class ProposalPhase(BaseModel):
    name: str
    duration_weeks: float
    deliverables: list[str] = Field(default_factory=list)


class Proposal(BaseDocument):
    workspace_id: str = ""
    lead_id: str
    title: str
    summary: Optional[str] = None
    scope: Optional[str] = None
    objectives: list[str] = Field(default_factory=list)
    items: list[ProposalItem] = Field(default_factory=list)
    phases: list[ProposalPhase] = Field(default_factory=list)
    subtotal: float = 0.0
    tax_rate: float = 0.12  # IVA GT
    tax: float = 0.0
    total: float = 0.0
    currency: str = "USD"
    valid_until: Optional[datetime] = None
    status: str = "draft"  # draft | sent | accepted | rejected
    generated_by_ai: bool = False


class ProposalGenerateRequest(BaseModel):
    lead_id: str
    services: list[str]
    notes: Optional[str] = ""


class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    scope: Optional[str] = None
    objectives: Optional[list[str]] = None
    items: Optional[list[ProposalItem]] = None
    phases: Optional[list[ProposalPhase]] = None
    status: Optional[str] = None
    valid_until: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Catalog / Services
# ---------------------------------------------------------------------------
class Service(BaseDocument):
    workspace_id: str = ""
    code: str
    name: str
    description: str
    category: str
    base_price: float = 0.0
    active: bool = True


class ServiceCreate(BaseModel):
    code: str
    name: str
    description: str
    category: str
    base_price: float = 0.0
    active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = None
    active: Optional[bool] = None
