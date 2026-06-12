"""Phase 3 backend tests — Plan limits, plan enforcement, super-admin endpoints.

Covers:
  - /api/workspaces/usage (auth user, includes limits + usage + available_plans)
  - Starter plan enforcement: lead limit (50/mes), user limit (2), no AI, no PDF
  - Pro plan enforcement: AI proposal works, PDF works
  - Enterprise plan: no limits (innovagraf default)
  - Diagnostic submit respects lead limit; existing email update does NOT count
  - Suspended workspace: POST blocked with 402 (Spanish 'suspendido'), GET still works for admin
  - Super-admin endpoints: overview / workspaces / PATCH / DELETE / plans
  - Role enforcement: admin (non-super) -> 403 on super-admin; comercial -> 403 on super-admin AND /admin/users + /services mutations
  - Workspace status migration: existing workspaces backfilled to 'active'
  - Innovagraf admin auto-promoted to super_admin on startup
"""
from __future__ import annotations

import os
import time

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

SUPER_EMAIL = "admin@innovagraf.com"
SUPER_PASS = "Innovagraf2026!"
SALES_EMAIL = "ventas@innovagraf.com"
SALES_PASS = "Ventas2026!"


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Session fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def super_token(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": SUPER_EMAIL, "password": SUPER_PASS}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "super_admin"
    return data["token"]


@pytest.fixture(scope="session")
def sales_token(session):
    r = session.post(f"{API}/auth/login",
                     json={"email": SALES_EMAIL, "password": SALES_PASS}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


# A fresh starter workspace is created per session (cheaper than per-test).
@pytest.fixture(scope="session")
def starter_ws(session):
    ts = int(time.time())
    slug = f"teststarter{ts}"
    payload = {
        "workspace_name": f"Test Starter {ts}",
        "workspace_slug": slug,
        "admin_name": "Starter Admin",
        "admin_email": f"starter+{ts}@test.com",
        "admin_password": "Starter2026!",
    }
    r = session.post(f"{API}/auth/signup", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "slug": slug,
        "token": data["token"],
        "user": data["user"],
        "workspace_id": data["user"]["workspace_id"],
        "admin_email": payload["admin_email"],
    }


@pytest.fixture(scope="session")
def pro_ws(session, super_token):
    """Sign up starter and then super-admin upgrade to pro."""
    ts = int(time.time())
    slug = f"testpro{ts}"
    payload = {
        "workspace_name": f"Test Pro {ts}",
        "workspace_slug": slug,
        "admin_name": "Pro Admin",
        "admin_email": f"pro+{ts}@test.com",
        "admin_password": "ProPass2026!",
    }
    r = session.post(f"{API}/auth/signup", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    wid = data["user"]["workspace_id"]
    # upgrade to pro via super-admin
    up = session.patch(f"{API}/super-admin/workspaces/{wid}",
                       json={"plan": "pro"}, headers=auth(super_token), timeout=30)
    assert up.status_code == 200, up.text
    assert up.json()["plan"] == "pro"
    return {"slug": slug, "token": data["token"], "workspace_id": wid,
            "admin_email": payload["admin_email"]}


# =========================================================================
# /api/workspaces/usage
# =========================================================================
class TestWorkspaceUsage:
    def test_usage_requires_auth(self, session):
        r = session.get(f"{API}/workspaces/usage", timeout=15)
        assert r.status_code == 401

    def test_usage_for_super_admin_innovagraf(self, session, super_token):
        r = session.get(f"{API}/workspaces/usage", headers=auth(super_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert set(data.keys()) >= {"workspace", "limits", "usage", "available_plans"}
        assert data["workspace"]["slug"] == "innovagraf"
        assert data["workspace"]["plan"] == "enterprise"
        assert data["limits"]["leads_per_month"] is None
        assert data["limits"]["ai_proposals"] is True
        assert data["limits"]["pdf_export"] is True
        assert "leads_this_month" in data["usage"]
        assert "users" in data["usage"]
        assert set(data["available_plans"]) == {"starter", "pro", "enterprise"}

    def test_usage_for_starter_workspace(self, session, starter_ws):
        r = session.get(f"{API}/workspaces/usage",
                        headers=auth(starter_ws["token"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["workspace"]["plan"] == "starter"
        assert d["limits"]["leads_per_month"] == 50
        assert d["limits"]["users"] == 2
        assert d["limits"]["ai_proposals"] is False
        assert d["limits"]["pdf_export"] is False


# =========================================================================
# Super-admin endpoints
# =========================================================================
class TestSuperAdminEndpoints:
    def test_overview(self, session, super_token):
        r = session.get(f"{API}/super-admin/overview",
                        headers=auth(super_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_workspaces", "active_workspaces", "suspended_workspaces",
                  "total_users", "total_leads", "total_proposals",
                  "total_won_value", "plan_distribution"):
            assert k in d, f"missing {k}"
        assert d["total_workspaces"] >= 1
        assert isinstance(d["plan_distribution"], dict)

    def test_list_workspaces_with_stats(self, session, super_token):
        r = session.get(f"{API}/super-admin/workspaces",
                        headers=auth(super_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        sample = items[0]
        assert "stats" in sample
        for k in ("leads_total", "leads_this_month", "users", "proposals"):
            assert k in sample["stats"]

    def test_plans_endpoint(self, session, super_token):
        r = session.get(f"{API}/super-admin/plans",
                        headers=auth(super_token), timeout=15)
        assert r.status_code == 200
        plans = r.json()
        assert set(plans.keys()) == {"starter", "pro", "enterprise"}
        assert plans["starter"]["leads_per_month"] == 50
        assert plans["starter"]["users"] == 2
        assert plans["starter"]["ai_proposals"] is False
        assert plans["pro"]["leads_per_month"] == 500
        assert plans["enterprise"]["leads_per_month"] is None

    def test_patch_invalid_plan_400(self, session, super_token, starter_ws):
        r = session.patch(f"{API}/super-admin/workspaces/{starter_ws['workspace_id']}",
                          json={"plan": "ultra"}, headers=auth(super_token), timeout=15)
        assert r.status_code == 400

    def test_patch_invalid_status_400(self, session, super_token, starter_ws):
        r = session.patch(f"{API}/super-admin/workspaces/{starter_ws['workspace_id']}",
                          json={"status": "banned"}, headers=auth(super_token), timeout=15)
        assert r.status_code == 400

    def test_cannot_delete_own_workspace(self, session, super_token):
        me = session.get(f"{API}/workspaces/me",
                         headers=auth(super_token), timeout=15).json()
        r = session.delete(f"{API}/super-admin/workspaces/{me['id']}",
                           headers=auth(super_token), timeout=15)
        assert r.status_code == 400

    def test_delete_workspace_cascade(self, session, super_token):
        # Create disposable workspace
        ts = int(time.time() * 1000)
        slug = f"todelete{ts}"
        sg = session.post(f"{API}/auth/signup", json={
            "workspace_name": f"To Delete {ts}", "workspace_slug": slug,
            "admin_name": "Del Admin", "admin_email": f"todel+{ts}@test.com",
            "admin_password": "Delete2026!"}, timeout=30)
        assert sg.status_code == 200
        wid = sg.json()["user"]["workspace_id"]
        # Confirm services seeded
        r0 = session.get(f"{API}/services",
                         headers=auth(sg.json()["token"]), timeout=15)
        assert r0.status_code == 200 and len(r0.json()) > 0

        r = session.delete(f"{API}/super-admin/workspaces/{wid}",
                           headers=auth(super_token), timeout=30)
        assert r.status_code == 200
        assert r.json().get("deleted") is True

        # Workspace gone — patching should now 404
        r2 = session.patch(f"{API}/super-admin/workspaces/{wid}",
                           json={"plan": "pro"}, headers=auth(super_token), timeout=15)
        assert r2.status_code == 404


# =========================================================================
# Role enforcement
# =========================================================================
class TestRoleEnforcement:
    def test_comercial_blocked_super_admin_overview(self, session, sales_token):
        r = session.get(f"{API}/super-admin/overview",
                        headers=auth(sales_token), timeout=15)
        assert r.status_code == 403

    def test_comercial_blocked_super_admin_workspaces(self, session, sales_token):
        r = session.get(f"{API}/super-admin/workspaces",
                        headers=auth(sales_token), timeout=15)
        assert r.status_code == 403

    def test_comercial_blocked_super_admin_plans(self, session, sales_token):
        r = session.get(f"{API}/super-admin/plans",
                        headers=auth(sales_token), timeout=15)
        assert r.status_code == 403

    def test_starter_admin_blocked_super_admin(self, session, starter_ws):
        """admin role (workspace owner) is NOT super_admin -> 403."""
        r = session.get(f"{API}/super-admin/overview",
                        headers=auth(starter_ws["token"]), timeout=15)
        assert r.status_code == 403

    def test_comercial_blocked_admin_users_post(self, session, sales_token):
        r = session.post(f"{API}/admin/users",
                         json={"email": "x@x.com", "name": "x",
                               "role": "comercial", "password": "abc123"},
                         headers=auth(sales_token), timeout=15)
        assert r.status_code == 403

    def test_comercial_blocked_services_post(self, session, sales_token):
        r = session.post(f"{API}/services",
                         json={"code": "tst_x", "name": "X",
                               "description": "x", "category": "cat", "base_price": 1},
                         headers=auth(sales_token), timeout=15)
        assert r.status_code == 403


# =========================================================================
# Starter plan enforcement
# =========================================================================
class TestStarterPlanEnforcement:
    def test_starter_ai_proposal_blocked_402(self, session, starter_ws):
        # Create a lead first
        lead = session.post(f"{API}/leads", json={
            "company_name": "AI Test Co", "contact_name": "Ana",
            "contact_email": f"ai+{int(time.time())}@test.com"},
            headers=auth(starter_ws["token"]), timeout=15)
        assert lead.status_code == 200
        lid = lead.json()["id"]
        r = session.post(f"{API}/proposals/generate",
                         json={"lead_id": lid, "services": ["Branding"]},
                         headers=auth(starter_ws["token"]), timeout=30)
        assert r.status_code == 402
        assert "plan" in r.json()["detail"].lower() or "pro" in r.json()["detail"].lower()

    def test_starter_pdf_blocked_402(self, session, starter_ws):
        # Even with a fake proposal id, gating must happen first (feature gate before lookup)
        r = session.get(f"{API}/proposals/fake-id/pdf",
                        headers=auth(starter_ws["token"]), timeout=15)
        assert r.status_code == 402

    def test_starter_user_limit_402_after_2(self, session, starter_ws):
        # Signup created 1 user (admin). Add 1 -> 2 users (at limit). 3rd -> 402.
        ts = int(time.time() * 1000)
        # add second user (should work)
        r1 = session.post(f"{API}/admin/users", json={
            "email": f"u2+{ts}@test.com", "name": "U2", "role": "comercial",
            "password": "password1"}, headers=auth(starter_ws["token"]), timeout=15)
        assert r1.status_code == 200, r1.text
        # third user -> 402
        r2 = session.post(f"{API}/admin/users", json={
            "email": f"u3+{ts}@test.com", "name": "U3", "role": "comercial",
            "password": "password1"}, headers=auth(starter_ws["token"]), timeout=15)
        assert r2.status_code == 402, r2.text
        detail = r2.json()["detail"].lower()
        assert "límite" in detail or "limite" in detail or "2" in detail


# =========================================================================
# Suspended workspace
# =========================================================================
class TestSuspendedWorkspace:
    def test_suspend_then_post_blocked_get_works(self, session, super_token):
        # Create disposable workspace, suspend it, then verify behaviours.
        ts = int(time.time() * 1000)
        sg = session.post(f"{API}/auth/signup", json={
            "workspace_name": f"Susp {ts}", "workspace_slug": f"susp{ts}",
            "admin_name": "Susp Admin", "admin_email": f"susp+{ts}@test.com",
            "admin_password": "Suspend2026!"}, timeout=30)
        assert sg.status_code == 200
        sd = sg.json()
        wid = sd["user"]["workspace_id"]
        wtoken = sd["token"]

        # Suspend via super-admin
        up = session.patch(f"{API}/super-admin/workspaces/{wid}",
                           json={"status": "suspended"},
                           headers=auth(super_token), timeout=15)
        assert up.status_code == 200
        assert up.json()["status"] == "suspended"

        # POST /api/leads -> 402 with 'suspendido' in detail
        r = session.post(f"{API}/leads",
                         json={"company_name": "X", "contact_name": "X",
                               "contact_email": f"sx+{ts}@x.com"},
                         headers=auth(wtoken), timeout=15)
        assert r.status_code == 402, r.text
        assert "suspend" in r.json()["detail"].lower()

        # diagnostic submit (public) also blocked
        slug = f"susp{ts}"
        diag_payload = {
            "company_name": "X", "contact_name": "X",
            "contact_email": f"sdx+{ts}@x.com", "answers": []}
        rd = session.post(f"{API}/diagnostic/submit?workspace={slug}",
                          json=diag_payload, timeout=60)
        assert rd.status_code == 402

        # GETs still work for the admin
        gl = session.get(f"{API}/leads", headers=auth(wtoken), timeout=15)
        assert gl.status_code == 200
        wm = session.get(f"{API}/workspaces/me", headers=auth(wtoken), timeout=15)
        assert wm.status_code == 200 and wm.json()["status"] == "suspended"

        # Cleanup
        session.delete(f"{API}/super-admin/workspaces/{wid}",
                       headers=auth(super_token), timeout=30)


# =========================================================================
# Plan upgrade reflects new caps
# =========================================================================
class TestPlanUpgradeReflects:
    def test_starter_to_pro_unlocks_features(self, session, super_token):
        # Make new starter workspace, then upgrade and verify usage limits change.
        ts = int(time.time() * 1000)
        sg = session.post(f"{API}/auth/signup", json={
            "workspace_name": f"Upg {ts}", "workspace_slug": f"upg{ts}",
            "admin_name": "Upg Admin", "admin_email": f"upg+{ts}@test.com",
            "admin_password": "Upgrade2026!"}, timeout=30)
        assert sg.status_code == 200
        sd = sg.json()
        wid = sd["user"]["workspace_id"]
        wtoken = sd["token"]

        r1 = session.get(f"{API}/workspaces/usage",
                         headers=auth(wtoken), timeout=15)
        assert r1.json()["limits"]["leads_per_month"] == 50

        up = session.patch(f"{API}/super-admin/workspaces/{wid}",
                           json={"plan": "pro"},
                           headers=auth(super_token), timeout=15)
        assert up.status_code == 200 and up.json()["plan"] == "pro"

        r2 = session.get(f"{API}/workspaces/usage",
                         headers=auth(wtoken), timeout=15)
        d = r2.json()
        assert d["workspace"]["plan"] == "pro"
        assert d["limits"]["leads_per_month"] == 500
        assert d["limits"]["users"] == 10
        assert d["limits"]["ai_proposals"] is True
        assert d["limits"]["pdf_export"] is True

        # Cleanup
        session.delete(f"{API}/super-admin/workspaces/{wid}",
                       headers=auth(super_token), timeout=30)


# =========================================================================
# Pro plan: AI + PDF allowed
# =========================================================================
class TestProPlanFeatures:
    def test_pro_ai_proposal_works(self, session, pro_ws):
        lead = session.post(f"{API}/leads", json={
            "company_name": "Pro AI Co", "contact_name": "Bob",
            "contact_email": f"proai+{int(time.time())}@test.com",
            "industry": "Retail"},
            headers=auth(pro_ws["token"]), timeout=15)
        assert lead.status_code == 200
        lid = lead.json()["id"]
        r = session.post(f"{API}/proposals/generate",
                         json={"lead_id": lid, "services": ["Branding", "Web"]},
                         headers=auth(pro_ws["token"]), timeout=90)
        assert r.status_code == 200, r.text
        prop = r.json()
        assert "id" in prop and prop["lead_id"] == lid
        # Stash for next test
        pytest._pro_proposal_id = prop["id"]

    def test_pro_pdf_works(self, session, pro_ws):
        pid = getattr(pytest, "_pro_proposal_id", None)
        assert pid, "previous test must have produced a proposal"
        r = session.get(f"{API}/proposals/{pid}/pdf",
                        headers=auth(pro_ws["token"]), timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert len(r.content) > 200  # actual PDF bytes


# =========================================================================
# Enterprise plan (innovagraf) — no limits, all features
# =========================================================================
class TestEnterpriseUnlimited:
    def test_innovagraf_usage_unlimited(self, session, super_token):
        r = session.get(f"{API}/workspaces/usage",
                        headers=auth(super_token), timeout=15)
        d = r.json()
        assert d["limits"]["leads_per_month"] is None
        assert d["limits"]["users"] is None
        assert d["limits"]["ai_proposals"] is True
        assert d["limits"]["pdf_export"] is True


# =========================================================================
# Diagnostic submit respects lead limit — and update of existing email
# does NOT count
# =========================================================================
class TestDiagnosticPlanRespect:
    def test_existing_email_update_does_not_count(self, session, super_token):
        # Use a fresh starter workspace
        ts = int(time.time() * 1000)
        slug = f"diag{ts}"
        sg = session.post(f"{API}/auth/signup", json={
            "workspace_name": f"Diag {ts}", "workspace_slug": slug,
            "admin_name": "Diag Admin", "admin_email": f"diag+{ts}@test.com",
            "admin_password": "Diagnostic2026!"}, timeout=30)
        assert sg.status_code == 200
        sd = sg.json()
        wid = sd["user"]["workspace_id"]
        wtoken = sd["token"]

        email = f"sameuser+{ts}@test.com"
        payload = {"company_name": "Same Co", "contact_name": "Same",
                   "contact_email": email, "answers": []}
        # First submit -> creates lead
        r1 = session.post(f"{API}/diagnostic/submit?workspace={slug}",
                          json=payload, timeout=60)
        assert r1.status_code == 200, r1.text

        # Snapshot usage
        u1 = session.get(f"{API}/workspaces/usage",
                         headers=auth(wtoken), timeout=15).json()
        leads_after_first = u1["usage"]["leads_this_month"]
        assert leads_after_first >= 1

        # Second submit same email -> should update, not create
        r2 = session.post(f"{API}/diagnostic/submit?workspace={slug}",
                          json=payload, timeout=60)
        assert r2.status_code == 200, r2.text

        u2 = session.get(f"{API}/workspaces/usage",
                         headers=auth(wtoken), timeout=15).json()
        assert u2["usage"]["leads_this_month"] == leads_after_first, \
            "Repeat email diagnostic submit should not add a new lead"

        # Cleanup
        session.delete(f"{API}/super-admin/workspaces/{wid}",
                       headers=auth(super_token), timeout=30)


# =========================================================================
# Migrations — sanity
# =========================================================================
class TestMigrations:
    def test_innovagraf_admin_is_super_admin(self, session):
        r = session.post(f"{API}/auth/login",
                         json={"email": SUPER_EMAIL, "password": SUPER_PASS},
                         timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "super_admin"

# =========================================================================
# Starter lead limit (50/mes)
# =========================================================================
class TestStarterLeadLimit:
    def test_starter_50_leads_then_402(self, session, super_token):
        ts = int(time.time() * 1000)
        slug = f"leadlim{ts}"
        sg = session.post(f"{API}/auth/signup", json={
            "workspace_name": f"LeadLim {ts}", "workspace_slug": slug,
            "admin_name": "LL Admin", "admin_email": f"ll+{ts}@test.com",
            "admin_password": "LeadLimit2026!"}, timeout=30)
        assert sg.status_code == 200
        sd = sg.json()
        wid = sd["user"]["workspace_id"]
        wtoken = sd["token"]
        h = auth(wtoken)

        # create 50 leads (the plan limit)
        for i in range(50):
            r = session.post(f"{API}/leads", json={
                "company_name": f"C{i}", "contact_name": f"N{i}",
                "contact_email": f"lead{i}+{ts}@x.com"},
                headers=h, timeout=15)
            assert r.status_code == 200, f"lead {i} failed: {r.status_code} {r.text}"

        # 51st should be blocked with 402
        r51 = session.post(f"{API}/leads", json={
            "company_name": "Overflow", "contact_name": "Over",
            "contact_email": f"over+{ts}@x.com"},
            headers=h, timeout=15)
        assert r51.status_code == 402, r51.text
        detail = r51.json()["detail"].lower()
        assert "50" in detail or "límite" in detail or "limite" in detail

        # diagnostic submit (new email) also blocked
        rd = session.post(f"{API}/diagnostic/submit?workspace={slug}",
                          json={"company_name": "X", "contact_name": "X",
                                "contact_email": f"dnew+{ts}@x.com",
                                "answers": []}, timeout=60)
        assert rd.status_code == 402, rd.text

        # Cleanup
        session.delete(f"{API}/super-admin/workspaces/{wid}",
                       headers=auth(super_token), timeout=30)


class TestMigrations2:
    def test_all_workspaces_have_active_status(self, session, super_token):
        r = session.get(f"{API}/super-admin/workspaces",
                        headers=auth(super_token), timeout=15)
        assert r.status_code == 200
        for w in r.json():
            assert w.get("status") in ("active", "suspended"), \
                f"workspace {w['slug']} has no status field"
