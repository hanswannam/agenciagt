"""End-to-end backend tests for Innovagraf Growth System.

Covers:
  - Auth (admin + comercial)
  - Public diagnostic endpoints (no auth required)
  - CRM Leads + Kanban + notes + status changes
  - Meetings (and side-effect on lead status)
  - Proposals: generate (LLM with fallback), update, PDF
  - Dashboard overview
  - Admin-only user management
  - Services catalog
  - Authentication enforcement (401) on protected endpoints
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@innovagraf.com"
ADMIN_PASS = "Innovagraf2026!"
SALES_EMAIL = "ventas@innovagraf.com"
SALES_PASS = "Ventas2026!"

LEAD_STATUSES = [
    "nuevo", "contactado", "diagnostico_completo", "reunion_agendada",
    "propuesta_enviada", "negociacion", "ganado", "perdido",
]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
                     timeout=30)
    assert r.status_code == 200, f"admin login failed {r.status_code}: {r.text}"
    data = r.json()
    assert "token" in data and data["user"]["role"] in ("admin", "super_admin")
    return data["token"]


@pytest.fixture(scope="session")
def sales_token(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": SALES_EMAIL, "password": SALES_PASS},
                     timeout=30)
    assert r.status_code == 200, f"sales login failed {r.status_code}: {r.text}"
    data = r.json()
    assert data["user"]["role"] == "comercial"
    return data["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TestAuth:
    def test_login_admin(self, session):
        r = session.post(f"{API}/auth/login",
                         json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["token"], str) and len(d["token"]) > 10
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] in ("admin", "super_admin")

    def test_login_sales(self, session):
        r = session.post(f"{API}/auth/login",
                         json={"email": SALES_EMAIL, "password": SALES_PASS}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "comercial"

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login",
                         json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me(self, session, admin_token):
        r = session.get(f"{API}/auth/me", headers=auth(admin_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_unauth(self, session):
        r = session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Diagnostic (public)
# ---------------------------------------------------------------------------
class TestDiagnostic:
    def test_questions_public(self, session):
        r = requests.get(f"{API}/diagnostic/questions", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["total_steps"] == 6
        assert len(d["steps"]) == 5
        for s in d["steps"]:
            assert "step" in s and "title" in s and "questions" in s
            assert len(s["questions"]) > 0

    def test_submit_public_creates_lead_and_diagnostic(self, session):
        payload = {
            "company_name": "TEST_Acme Corp",
            "industry": "Tecnología",
            "company_size": "21-50",
            "contact_name": "TEST Contact",
            "contact_email": f"test_diag_{int(time.time())}@example.com",
            "contact_phone": "+50212345678",
            "contact_role": "CEO",
            "answers": [
                {"question_id": "industry", "value": "Tecnología"},
                {"question_id": "company_size", "value": "21-50"},
                {"question_id": "has_website", "value": "No"},
                {"question_id": "website_traffic", "value": "< 500"},
                {"question_id": "social_presence", "value": ["Facebook", "Instagram"]},
                {"question_id": "has_crm", "value": "No, usamos Excel/papel"},
                {"question_id": "leads_per_month", "value": "50-200"},
                {"question_id": "has_automation", "value": "Nada automatizado"},
                {"question_id": "has_erp", "value": "No"},
                {"question_id": "customer_channels", "value": ["WhatsApp", "Llamadas", "Email"]},
                {"question_id": "support_volume", "value": "500-2,000"},
                {"question_id": "has_chatbot", "value": "No"},
                {"question_id": "marketing_investment", "value": "< $300"},
                {"question_id": "conversion_tracking", "value": "No medimos"},
                {"question_id": "main_goal", "value": "Atraer más clientes"},
                {"question_id": "interested_services", "value": ["CRM", "Chatbot IA"]},
            ],
        }
        # Public endpoint - explicitly no auth header
        r = requests.post(f"{API}/diagnostic/submit", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "diagnostic_id" in d and "lead_id" in d
        assert isinstance(d["scores"], dict)
        for cat in ("web", "crm", "automation", "ai", "marketing"):
            assert cat in d["scores"]
        assert 0 <= d["maturity_score"] <= 100
        assert isinstance(d["recommendations"], list) and len(d["recommendations"]) > 0
        for rec in d["recommendations"]:
            assert "service" in rec
            assert rec["priority"] in (1, 2, 3)
            assert "estimated_price" in rec and rec["estimated_price"] > 0
            assert "reason" in rec
        assert isinstance(d["ai_summary"], str) and len(d["ai_summary"]) > 0
        assert d["estimated_value"] > 0
        # share with other tests
        pytest._diag_id = d["diagnostic_id"]
        pytest._diag_lead_id = d["lead_id"]

    def test_get_diagnostic_public(self, session):
        diag_id = getattr(pytest, "_diag_id", None)
        assert diag_id, "previous submit test must run first"
        r = requests.get(f"{API}/diagnostic/{diag_id}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == diag_id
        assert d["completed"] is True

    def test_get_diagnostic_404(self, session):
        r = requests.get(f"{API}/diagnostic/nonexistent-id", timeout=15)
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Leads / CRM
# ---------------------------------------------------------------------------
class TestLeads:
    def test_list_leads_requires_auth(self, session):
        r = session.get(f"{API}/leads", timeout=15)
        assert r.status_code in (401, 403)

    def test_list_leads_contains_diagnostic_lead(self, session, admin_token):
        r = session.get(f"{API}/leads", headers=auth(admin_token), timeout=15)
        assert r.status_code == 200
        leads = r.json()
        assert isinstance(leads, list)
        lead_id = getattr(pytest, "_diag_lead_id", None)
        match = [l for l in leads if l["id"] == lead_id]
        assert match, "diagnostic-created lead not present"
        assert match[0]["status"] == "diagnostico_completo"

    def test_kanban_all_statuses(self, session, admin_token):
        r = session.get(f"{API}/leads/kanban", headers=auth(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["statuses"] == LEAD_STATUSES
        assert set(d["columns"].keys()) == set(LEAD_STATUSES)

    def test_create_manual_lead(self, session, sales_token):
        payload = {
            "company_name": "TEST_Manual Lead Co",
            "contact_name": "Manual Contact",
            "contact_email": f"test_manual_{int(time.time())}@example.com",
            "contact_phone": "+50298765432",
            "industry": "Retail",
            "estimated_value": 5000,
            "status": "contactado",
        }
        r = session.post(f"{API}/leads", headers=auth(sales_token), json=payload, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["company_name"] == "TEST_Manual Lead Co"
        assert d["status"] == "contactado"
        assert len(d["activities"]) >= 1
        pytest._manual_lead_id = d["id"]

    def test_patch_lead_status_change_adds_activity(self, session, sales_token):
        lid = pytest._manual_lead_id
        r = session.patch(f"{API}/leads/{lid}", headers=auth(sales_token),
                          json={"status": "negociacion"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "negociacion"
        # verify activity log includes status_change
        status_changes = [a for a in d["activities"] if a["type"] == "status_change"]
        assert any("negociacion" in a["description"] for a in status_changes)

    def test_add_note(self, session, sales_token):
        lid = pytest._manual_lead_id
        r = session.post(f"{API}/leads/{lid}/notes", headers=auth(sales_token),
                         json={"text": "TEST follow-up note"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["text"] == "TEST follow-up note"
        # check note + activity persisted
        r2 = session.get(f"{API}/leads/{lid}", headers=auth(sales_token), timeout=15)
        assert r2.status_code == 200
        d = r2.json()
        assert any(n["text"] == "TEST follow-up note" for n in d["notes"])
        assert any(a["type"] == "note" for a in d["activities"])


# ---------------------------------------------------------------------------
# Meetings
# ---------------------------------------------------------------------------
class TestMeetings:
    def test_create_meeting_and_status_change(self, session, sales_token):
        # use diagnostic lead which is in diagnostico_completo
        lead_id = pytest._diag_lead_id
        when = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        r = session.post(f"{API}/meetings", headers=auth(sales_token), json={
            "lead_id": lead_id,
            "title": "TEST Discovery call",
            "description": "Initial chat",
            "scheduled_at": when,
            "duration_min": 45,
            "attendees": ["sales@example.com"],
        }, timeout=15)
        assert r.status_code == 200, r.text
        m = r.json()
        assert m["lead_id"] == lead_id
        pytest._meeting_id = m["id"]

        # Lead should now be reunion_agendada
        r2 = session.get(f"{API}/leads/{lead_id}", headers=auth(sales_token), timeout=15)
        assert r2.status_code == 200
        assert r2.json()["status"] == "reunion_agendada"

    def test_list_meetings(self, session, sales_token):
        r = session.get(f"{API}/meetings", headers=auth(sales_token), timeout=15)
        assert r.status_code == 200
        assert any(m["id"] == pytest._meeting_id for m in r.json())


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------
class TestProposals:
    def test_generate_proposal(self, session, sales_token):
        lead_id = pytest._diag_lead_id
        r = session.post(f"{API}/proposals/generate", headers=auth(sales_token), json={
            "lead_id": lead_id,
            "services": ["Página Web", "CRM", "Chatbot IA"],
            "notes": "TEST proposal generation",
        }, timeout=120)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["lead_id"] == lead_id
        assert isinstance(p["items"], list) and len(p["items"]) > 0
        # totals integrity
        recompute = round(sum(i["quantity"] * i["unit_price"] for i in p["items"]), 2)
        assert abs(p["subtotal"] - recompute) < 0.01
        assert abs(p["tax"] - round(p["subtotal"] * 0.12, 2)) < 0.01
        assert abs(p["total"] - round(p["subtotal"] + p["tax"], 2)) < 0.01
        assert p["status"] == "draft"
        pytest._proposal_id = p["id"]

        # check lead activity has proposal entry
        r2 = session.get(f"{API}/leads/{lead_id}", headers=auth(sales_token), timeout=15)
        assert any(a["type"] == "proposal" for a in r2.json()["activities"])

    def test_patch_proposal_recomputes_and_marks_sent(self, session, sales_token):
        pid = pytest._proposal_id
        new_items = [
            {"name": "Item A", "description": "x", "quantity": 2, "unit_price": 500, "total": 0},
            {"name": "Item B", "description": "y", "quantity": 1, "unit_price": 1000, "total": 0},
        ]
        r = session.patch(f"{API}/proposals/{pid}", headers=auth(sales_token), json={
            "items": new_items,
            "status": "sent",
        }, timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["subtotal"] == 2000.0
        assert p["tax"] == 240.0
        assert p["total"] == 2240.0
        assert p["status"] == "sent"

        # lead status should be propuesta_enviada
        lead_id = pytest._diag_lead_id
        r2 = session.get(f"{API}/leads/{lead_id}", headers=auth(sales_token), timeout=15)
        assert r2.json()["status"] == "propuesta_enviada"

    def test_get_proposal_pdf(self, session, sales_token):
        pid = pytest._proposal_id
        r = session.get(f"{API}/proposals/{pid}/pdf", headers=auth(sales_token), timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert len(r.content) > 500
        assert r.content[:4] == b"%PDF"


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
class TestDashboard:
    def test_overview(self, session, admin_token):
        r = session.get(f"{API}/dashboard/overview", headers=auth(admin_token), timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_leads", "conversion_rate", "pipeline_value",
                  "won_value", "avg_maturity_score", "funnel",
                  "services_demand", "leads_trend"):
            assert k in d, f"missing {k}"
        assert len(d["funnel"]) == 8
        assert {f["status"] for f in d["funnel"]} == set(LEAD_STATUSES)
        assert len(d["leads_trend"]) == 6
        assert isinstance(d["services_demand"], list)


# ---------------------------------------------------------------------------
# Admin: users CRUD + RBAC
# ---------------------------------------------------------------------------
class TestAdminUsers:
    def test_list_users_admin(self, session, admin_token):
        r = session.get(f"{API}/admin/users", headers=auth(admin_token), timeout=15)
        assert r.status_code == 200
        users = r.json()
        emails = {u["email"] for u in users}
        assert ADMIN_EMAIL in emails and SALES_EMAIL in emails

    def test_list_users_forbidden_for_sales(self, session, sales_token):
        r = session.get(f"{API}/admin/users", headers=auth(sales_token), timeout=15)
        assert r.status_code == 403

    def test_create_update_delete_user(self, session, admin_token):
        email = f"test_user_{int(time.time())}@example.com"
        r = session.post(f"{API}/admin/users", headers=auth(admin_token), json={
            "email": email, "name": "TEST User", "role": "comercial", "password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 200
        uid = r.json()["id"]

        r2 = session.patch(f"{API}/admin/users/{uid}", headers=auth(admin_token),
                           json={"name": "TEST Updated"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST Updated"

        r3 = session.delete(f"{API}/admin/users/{uid}", headers=auth(admin_token), timeout=15)
        assert r3.status_code == 200
        assert r3.json()["deleted"] is True

    def test_create_user_forbidden_for_sales(self, session, sales_token):
        r = session.post(f"{API}/admin/users", headers=auth(sales_token), json={
            "email": "blocked@x.com", "name": "x", "role": "comercial", "password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------
class TestServices:
    def test_list_services(self, session, admin_token):
        r = session.get(f"{API}/services", headers=auth(admin_token), timeout=15)
        assert r.status_code == 200
        services = r.json()
        assert len(services) >= 7
        names = {s["name"] for s in services}
        for expected in ("Página Web", "Landing Page", "CRM", "Chatbot IA",
                         "Agente de Voz IA", "ERP", "Automatizaciones"):
            assert expected in names, f"seed service missing: {expected}"

    def test_create_service_admin(self, session, admin_token):
        code = f"test_svc_{int(time.time())}"
        r = session.post(f"{API}/services", headers=auth(admin_token), json={
            "code": code, "name": "TEST Service", "description": "tmp",
            "category": "web", "base_price": 250.0,
        }, timeout=15)
        assert r.status_code == 200
        sid = r.json()["id"]
        # cleanup
        r2 = session.delete(f"{API}/services/{sid}", headers=auth(admin_token), timeout=15)
        assert r2.status_code == 200

    def test_create_service_forbidden_for_sales(self, session, sales_token):
        r = session.post(f"{API}/services", headers=auth(sales_token), json={
            "code": "x", "name": "x", "description": "x", "category": "web",
        }, timeout=15)
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Auth enforcement: protected endpoints require token
# ---------------------------------------------------------------------------
class TestAuthEnforcement:
    @pytest.mark.parametrize("method,path", [
        ("get", "/leads"),
        ("get", "/leads/kanban"),
        ("get", "/meetings"),
        ("get", "/proposals"),
        ("get", "/dashboard/overview"),
        ("get", "/admin/users"),
        ("get", "/services"),
    ])
    def test_requires_auth(self, session, method, path):
        r = getattr(session, method)(f"{API}{path}", timeout=15)
        assert r.status_code in (401, 403), f"{path} returned {r.status_code}"
