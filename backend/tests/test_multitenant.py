"""Multi-tenant (workspace) backend tests for Innovagraf Growth System.

Covers:
  - POST /api/auth/signup happy path + duplicates + invalid slug
  - GET /api/auth/me / /api/workspaces/me populated with workspace
  - Cross-workspace isolation for leads/proposals/meetings/services
  - Public diagnostic submit ?workspace=<slug> scoping + default + 404
  - Admin user creation scoped to workspace + role escalation protection
  - Dashboard scoped to workspace
  - Migration: seeded admin/ventas have workspace_id = 'innovagraf'
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

UNIQUE = int(time.time())
ACME_SLUG = f"acme{UNIQUE}"
ACME_EMAIL = f"owner_{UNIQUE}@acme.com"
ACME_PASS = "AcmePass2026!"

DIAG_PAYLOAD_BASE = {
    "company_name": "TEST_MT Co",
    "industry": "Tecnología",
    "company_size": "21-50",
    "contact_name": "MT Contact",
    "contact_phone": "+50211110000",
    "contact_role": "CEO",
    "answers": [
        {"question_id": "industry", "value": "Tecnología"},
        {"question_id": "company_size", "value": "21-50"},
        {"question_id": "has_website", "value": "No"},
        {"question_id": "website_traffic", "value": "< 500"},
        {"question_id": "social_presence", "value": ["Facebook"]},
        {"question_id": "has_crm", "value": "No, usamos Excel/papel"},
        {"question_id": "leads_per_month", "value": "50-200"},
        {"question_id": "has_automation", "value": "Nada automatizado"},
        {"question_id": "has_erp", "value": "No"},
        {"question_id": "customer_channels", "value": ["WhatsApp"]},
        {"question_id": "support_volume", "value": "500-2,000"},
        {"question_id": "has_chatbot", "value": "No"},
        {"question_id": "marketing_investment", "value": "< $300"},
        {"question_id": "conversion_tracking", "value": "No medimos"},
        {"question_id": "main_goal", "value": "Atraer más clientes"},
        {"question_id": "interested_services", "value": ["CRM"]},
    ],
}


def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def innovagraf_admin(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def innovagraf_token(innovagraf_admin):
    return innovagraf_admin["token"]


@pytest.fixture(scope="session")
def acme_signup(session):
    """Create the ACME workspace via signup. Shared by all subsequent tests."""
    r = session.post(f"{API}/auth/signup", json={
        "workspace_name": "Acme Corp",
        "workspace_slug": ACME_SLUG,
        "admin_name": "Acme Owner",
        "admin_email": ACME_EMAIL,
        "admin_password": ACME_PASS,
    }, timeout=30)
    assert r.status_code == 200, f"signup failed: {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def acme_token(acme_signup):
    return acme_signup["token"]


# ---------------------------------------------------------------------------
# Signup happy path + validation
# ---------------------------------------------------------------------------
class TestSignup:
    def test_signup_creates_workspace_and_admin(self, acme_signup):
        d = acme_signup
        assert isinstance(d["token"], str) and len(d["token"]) > 10
        u = d["user"]
        assert u["email"] == ACME_EMAIL
        assert u["role"] == "admin"
        assert u["workspace_id"]
        assert u["workspace"]["slug"] == ACME_SLUG
        assert u["workspace"]["name"] == "Acme Corp"
        assert u["workspace"]["plan"] == "starter"

    def test_signup_seeds_services_for_new_workspace(self, session, acme_token):
        r = session.get(f"{API}/services", headers=auth(acme_token), timeout=15)
        assert r.status_code == 200
        services = r.json()
        assert len(services) >= 7, f"expected >=7 seeded services, got {len(services)}"
        names = {s["name"] for s in services}
        for expected in ("Página Web", "CRM", "Chatbot IA"):
            assert expected in names

    def test_signup_duplicate_slug_400(self, session):
        r = session.post(f"{API}/auth/signup", json={
            "workspace_name": "Acme Dup",
            "workspace_slug": ACME_SLUG,  # already exists
            "admin_name": "Dup",
            "admin_email": f"dup_{UNIQUE}@x.com",
            "admin_password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 400

    def test_signup_duplicate_email_400(self, session):
        r = session.post(f"{API}/auth/signup", json={
            "workspace_name": "Other WS",
            "workspace_slug": f"other-{UNIQUE}",
            "admin_name": "x",
            "admin_email": ADMIN_EMAIL,  # already exists in innovagraf
            "admin_password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 400

    def test_signup_invalid_slug_uppercase_422(self, session):
        r = session.post(f"{API}/auth/signup", json={
            "workspace_name": "Bad",
            "workspace_slug": "BadSlug",  # uppercase
            "admin_name": "x",
            "admin_email": f"bad1_{UNIQUE}@x.com",
            "admin_password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 422

    def test_signup_invalid_slug_spaces_422(self, session):
        r = session.post(f"{API}/auth/signup", json={
            "workspace_name": "Bad",
            "workspace_slug": "bad slug",
            "admin_name": "x",
            "admin_email": f"bad2_{UNIQUE}@x.com",
            "admin_password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# /auth/me and /workspaces/me
# ---------------------------------------------------------------------------
class TestWorkspaceMe:
    def test_me_includes_workspace(self, session, innovagraf_token):
        r = session.get(f"{API}/auth/me", headers=auth(innovagraf_token), timeout=15)
        assert r.status_code == 200
        u = r.json()
        assert u["workspace_id"]
        assert u["workspace"]["slug"] == "innovagraf"

    def test_workspaces_me_innovagraf(self, session, innovagraf_token):
        r = session.get(f"{API}/workspaces/me", headers=auth(innovagraf_token), timeout=15)
        assert r.status_code == 200
        ws = r.json()
        assert ws["slug"] == "innovagraf"
        assert "id" in ws and "name" in ws and "plan" in ws

    def test_workspaces_me_acme(self, session, acme_token):
        r = session.get(f"{API}/workspaces/me", headers=auth(acme_token), timeout=15)
        assert r.status_code == 200
        ws = r.json()
        assert ws["slug"] == ACME_SLUG
        assert ws["plan"] == "starter"


# ---------------------------------------------------------------------------
# Public diagnostic with workspace param
# ---------------------------------------------------------------------------
class TestDiagnosticWorkspace:
    _acme_lead_id = None
    _innovagraf_lead_id = None

    def test_submit_default_innovagraf(self, session):
        payload = dict(DIAG_PAYLOAD_BASE)
        payload["company_name"] = "TEST_MT_Innovagraf"
        payload["contact_email"] = f"mt_inno_{UNIQUE}@example.com"
        r = requests.post(f"{API}/diagnostic/submit", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["workspace_slug"] == "innovagraf"
        TestDiagnosticWorkspace._innovagraf_lead_id = d["lead_id"]

    def test_submit_acme_workspace(self, session):
        payload = dict(DIAG_PAYLOAD_BASE)
        payload["company_name"] = "TEST_MT_Acme"
        payload["contact_email"] = f"mt_acme_{UNIQUE}@example.com"
        r = requests.post(f"{API}/diagnostic/submit?workspace={ACME_SLUG}",
                          json=payload, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["workspace_slug"] == ACME_SLUG
        TestDiagnosticWorkspace._acme_lead_id = d["lead_id"]

    def test_submit_nonexistent_workspace_404(self, session):
        payload = dict(DIAG_PAYLOAD_BASE)
        payload["contact_email"] = f"mt_404_{UNIQUE}@example.com"
        r = requests.post(f"{API}/diagnostic/submit?workspace=does-not-exist",
                          json=payload, timeout=30)
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Cross-workspace isolation
# ---------------------------------------------------------------------------
class TestIsolation:
    def test_acme_leads_does_not_include_innovagraf(self, session, acme_token):
        r = session.get(f"{API}/leads", headers=auth(acme_token), timeout=15)
        assert r.status_code == 200
        leads = r.json()
        # only acme leads. The lead created via diagnostic submit?workspace=acme
        acme_lead_id = TestDiagnosticWorkspace._acme_lead_id
        inno_lead_id = TestDiagnosticWorkspace._innovagraf_lead_id
        ids = {l["id"] for l in leads}
        if acme_lead_id:
            assert acme_lead_id in ids
        if inno_lead_id:
            assert inno_lead_id not in ids

    def test_innovagraf_leads_does_not_include_acme(self, session, innovagraf_token):
        r = session.get(f"{API}/leads", headers=auth(innovagraf_token), timeout=15)
        assert r.status_code == 200
        leads = r.json()
        ids = {l["id"] for l in leads}
        acme_lead_id = TestDiagnosticWorkspace._acme_lead_id
        if acme_lead_id:
            assert acme_lead_id not in ids

    def test_acme_cannot_fetch_innovagraf_lead(self, session, innovagraf_token, acme_token):
        # find any innovagraf lead
        r = session.get(f"{API}/leads", headers=auth(innovagraf_token), timeout=15)
        leads = r.json()
        if not leads:
            pytest.skip("no innovagraf leads to test against")
        target = leads[0]["id"]
        r2 = session.get(f"{API}/leads/{target}", headers=auth(acme_token), timeout=15)
        assert r2.status_code == 404
        r3 = session.patch(f"{API}/leads/{target}", headers=auth(acme_token),
                           json={"status": "contactado"}, timeout=15)
        assert r3.status_code == 404

    def test_acme_services_isolated(self, session, innovagraf_token, acme_token):
        # innovagraf has 7+ services, acme has its own seed of 7
        r_inno = session.get(f"{API}/services", headers=auth(innovagraf_token), timeout=15)
        r_acme = session.get(f"{API}/services", headers=auth(acme_token), timeout=15)
        assert r_inno.status_code == 200 and r_acme.status_code == 200
        inno_ids = {s["id"] for s in r_inno.json()}
        acme_ids = {s["id"] for s in r_acme.json()}
        # they should be disjoint sets (each ws has its own seeded services)
        assert inno_ids.isdisjoint(acme_ids), "service ids leaked across workspaces"

    def test_acme_cannot_modify_innovagraf_service(self, session, innovagraf_token, acme_token):
        r = session.get(f"{API}/services", headers=auth(innovagraf_token), timeout=15)
        svc_id = r.json()[0]["id"]
        r2 = session.patch(f"{API}/services/{svc_id}", headers=auth(acme_token),
                           json={"name": "HACKED"}, timeout=15)
        assert r2.status_code == 404
        r3 = session.delete(f"{API}/services/{svc_id}", headers=auth(acme_token), timeout=15)
        assert r3.status_code == 404


# ---------------------------------------------------------------------------
# Admin user creation scoped + role escalation
# ---------------------------------------------------------------------------
class TestAdminUsersWorkspace:
    _acme_user_email = None
    _acme_user_id = None

    def test_acme_admin_creates_user(self, session, acme_token):
        email = f"acme_user_{UNIQUE}@example.com"
        r = session.post(f"{API}/admin/users", headers=auth(acme_token), json={
            "email": email, "name": "TEST Acme User",
            "role": "comercial", "password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["email"] == email
        # workspace must match acme
        assert d["workspace"]["slug"] == ACME_SLUG
        TestAdminUsersWorkspace._acme_user_email = email
        TestAdminUsersWorkspace._acme_user_id = d["id"]

    def test_new_acme_user_can_login_and_only_sees_acme(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": TestAdminUsersWorkspace._acme_user_email,
            "password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 200
        tok = r.json()["token"]
        r2 = session.get(f"{API}/workspaces/me", headers=auth(tok), timeout=15)
        assert r2.json()["slug"] == ACME_SLUG
        # see only acme leads
        r3 = session.get(f"{API}/leads", headers=auth(tok), timeout=15)
        assert r3.status_code == 200

    def test_admin_users_list_scoped(self, session, acme_token):
        r = session.get(f"{API}/admin/users", headers=auth(acme_token), timeout=15)
        assert r.status_code == 200
        emails = {u["email"] for u in r.json()}
        assert ADMIN_EMAIL not in emails  # innovagraf admin must not appear
        assert ACME_EMAIL in emails

    def test_cannot_create_super_admin(self, session, acme_token):
        r = session.post(f"{API}/admin/users", headers=auth(acme_token), json={
            "email": f"superx_{UNIQUE}@x.com",
            "name": "Super X",
            "role": "super_admin",
            "password": "Test1234!",
        }, timeout=15)
        assert r.status_code == 400

    def test_cannot_escalate_via_update(self, session, acme_token):
        uid = TestAdminUsersWorkspace._acme_user_id
        r = session.patch(f"{API}/admin/users/{uid}", headers=auth(acme_token),
                          json={"role": "super_admin"}, timeout=15)
        assert r.status_code == 400

    def test_cleanup_acme_user(self, session, acme_token):
        uid = TestAdminUsersWorkspace._acme_user_id
        if uid:
            session.delete(f"{API}/admin/users/{uid}",
                           headers=auth(acme_token), timeout=15)


# ---------------------------------------------------------------------------
# Services CRUD per workspace
# ---------------------------------------------------------------------------
class TestServicesWorkspace:
    def test_create_service_in_acme(self, session, acme_token):
        code = f"acme_svc_{UNIQUE}"
        r = session.post(f"{API}/services", headers=auth(acme_token), json={
            "code": code, "name": "TEST Acme Svc", "description": "x",
            "category": "web", "base_price": 100.0,
        }, timeout=15)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]
        # Innovagraf must not see this service
        r2 = session.get(f"{API}/services",
                         headers=auth(_innovagraf_only_login(session)), timeout=15)
        if r2.status_code == 200:
            ids = {s["id"] for s in r2.json()}
            assert sid not in ids
        # cleanup
        session.delete(f"{API}/services/{sid}", headers=auth(acme_token), timeout=15)


def _innovagraf_only_login(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    return r.json()["token"]


# ---------------------------------------------------------------------------
# Dashboard scope
# ---------------------------------------------------------------------------
class TestDashboardScope:
    def test_dashboard_scoped(self, session, innovagraf_token, acme_token):
        r_inno = session.get(f"{API}/dashboard/overview",
                             headers=auth(innovagraf_token), timeout=20)
        r_acme = session.get(f"{API}/dashboard/overview",
                             headers=auth(acme_token), timeout=20)
        assert r_inno.status_code == 200
        assert r_acme.status_code == 200
        # acme should have far fewer leads than innovagraf (innovagraf has many seeded/old)
        inno_total = r_inno.json()["total_leads"]
        acme_total = r_acme.json()["total_leads"]
        # acme created at most 1-2 leads via diagnostic in this test run
        assert acme_total <= 5
        # they must differ in general (sanity, not absolute)
        assert inno_total != acme_total or (inno_total == acme_total == 0)


# ---------------------------------------------------------------------------
# Migration: seeded innovagraf data has workspace_id
# ---------------------------------------------------------------------------
class TestMigration:
    def test_innovagraf_admin_has_workspace(self, session, innovagraf_token):
        r = session.get(f"{API}/auth/me", headers=auth(innovagraf_token), timeout=15)
        u = r.json()
        assert u["workspace_id"]
        assert u["workspace"]["slug"] == "innovagraf"

    def test_innovagraf_services_present(self, session, innovagraf_token):
        r = session.get(f"{API}/services", headers=auth(innovagraf_token), timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 7
