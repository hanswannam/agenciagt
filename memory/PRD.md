# PRD — Innovagraf Growth System

## Original Problem Statement
Crear una plataforma SaaS llamada "Innovagraf Growth System" para captar empresas interesadas en páginas web, CRM, automatización, chatbots y agentes de IA, mediante diagnóstico empresarial automatizado y recomendaciones personalizadas. Estilo moderno tipo HubSpot/Salesforce con colores Innovagraf (naranja #FF4F00, midnight #0B0F19).

## Architecture
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion + @hello-pangea/dnd + recharts. Routing via react-router-dom v7.
- **Backend**: FastAPI + Motor (Mongo async) + JWT auth (bcrypt) + emergentintegrations (Claude Sonnet 4.5) + reportlab (PDF).
- **DB**: MongoDB (`innovagraf_growth`). All collections use UUID `id` field; documents extend `BaseDocument` with `to_mongo` / `from_mongo`.
- **AI**: Claude Sonnet 4.5 (`claude-sonnet-4-6`) via Emergent LLM Key for diagnostic summary + proposal generation. Rule-based fallback always available.

## User Personas
1. **Visitante / prospecto** — completa el diagnóstico anónimo y recibe plan personalizado.
2. **Ejecutivo Comercial** (`role: comercial`) — gestiona leads, agenda reuniones, genera propuestas.
3. **Administrador** (`role: admin`) — todo lo anterior + gestiona usuarios y catálogo de servicios.

## Core Requirements (static)
- Landing pública, formulario diagnóstico multi-paso (5 + 1 contacto), scoring por área, recomendaciones con IA, CRM Kanban (8 estados), agenda, generador de propuestas IA con PDF, dashboard, admin de usuarios y servicios.

## What's been implemented (2026-02-12)
- Backend: auth (JWT), diagnostic submit/results (público), leads CRUD + Kanban + notes + activities, meetings, proposals (IA + edición + PDF), dashboard analytics, admin users + services catalog. 36/36 tests passed.
- Frontend: Landing comercial, Diagnóstico multi-paso con autosave, página de resultados con IA summary y gauge de madurez, Login, Dashboard con KPIs + funnel + tendencia + demanda de servicios, CRM Kanban con drag-and-drop, lista de leads + detalle (notas, actividad, reuniones, propuestas), agenda de reuniones, lista de propuestas + editor con PDF, panel admin (usuarios + catálogo).
- Branding Innovagraf (naranja #FF4F00 + midnight) + fuentes Outfit/Plus Jakarta Sans.
- Seed admin (admin@innovagraf.com / Innovagraf2026!) + ventas (ventas@innovagraf.com / Ventas2026!).

## What's been implemented (2026-02-13) — Phase 2: Multi-tenant
- **Workspaces**: nuevo modelo `Workspace` con `slug` único, `name`, `plan`. Constante DEFAULT_WORKSPACE_SLUG="innovagraf".
- **`workspace_id`** agregado a User, Lead, Diagnostic, Meeting, Proposal, Service.
- **Signup público** `POST /api/auth/signup` — crea workspace + admin + siembra 7 servicios.
- **`GET /api/workspaces/me`** retorna workspace del usuario actual.
- **Aislamiento total**: todas las queries CRUD están filtradas por `workspace_id` via helper `ws_filter(user)`. Cross-workspace access devuelve 404.
- **Diagnóstico público multi-workspace**: `POST /api/diagnostic/submit?workspace=<slug>` y ruta UI `/diagnostico/w/:slug`. Default = innovagraf (retrocompat).
- **Rol super_admin** introducido para Innovagraf (seed). `require_admin` permite admin OR super_admin.
- **Migración automática on startup**: backfill de workspace_id para docs huérfanos.
- **Frontend**: página `/signup` con auto-slug + redirección a dashboard, sidebar muestra workspace badge + URL pública.
- **63/63 tests passed** (36 regresión + 27 multi-tenant).

## Backlog (P0 → P2)
### P1 — phase 2 (integrations)
- Google Calendar integration on `/meetings` (currently calendario interno).
- WhatsApp Cloud API reminders for meetings.
- Resend / SendGrid for email confirmations and proposal delivery.
- Email proposal directly from `/proposals/:id` (Send + tracked open).

### P2 — quality of life
- Multi-empresa / multi-tenant (collection-per-workspace or workspace_id field).
- Lead assignment to specific commercial user + filters.
- Custom diagnostic templates (admin-editable).
- Export leads/proposals to CSV/Excel.
- Lifespan migration (replace deprecated `@app.on_event`).
- Pagination on `/leads` + `/proposals`.

## Next tasks
- Show user the result; gather feedback on diagnostic questions/scoring weights and proposal wording.
- Optionally wire Google Calendar (Emergent OAuth) and WhatsApp Cloud API as Phase 2.
