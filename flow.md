# PocketBank — Flow Log

## Step 1 — Project Initialization
**What:** Created project structure for PocketBank web app.
**Why:** Migrating EconomiKids from Android + Spring Boot to a web app (Node.js + React + TypeScript) that runs on a Raspberry Pi. Chose SQLite + Prisma for zero-overhead DB on Pi. Express serves React build as static files — single process. Port 8080.

**Security fixes applied vs original:**
- Passwords hashed with bcrypt (original stored plaintext)
- Auth credentials sent in POST body, not URL path
- JWT in httpOnly cookies for session management
- No hard-coded IPs — all config via .env

**Stack:**
- Backend: Node.js + TypeScript + Express (port 8080)
- Frontend: React + TypeScript
- DB: SQLite + Prisma ORM
- Auth: JWT + bcrypt

---

## Step 2 — Server Foundation
**What:** Built the complete server layer: package.json, tsconfig, Prisma schema (SQLite, 6 models), Express app wired to 7 route files, 7 controller files, and JWT auth middleware.
**Why:** Establishing the full server skeleton with real logic so the client can be built against a working API in the next step.

**Key decisions:**
- Passwords hashed with bcrypt (10 rounds) — fixes plaintext storage from original
- Auth via POST body, not URL — fixes credential exposure from original
- JWT in httpOnly cookie, 7-day expiry — fixes no-session issue from original
- Prisma transactions used for all multi-table writes (action + balance + loan/invest) — ensures consistency
- `compound()` helper: `PV × (1 + r/100)^months` — preserves original interest formula exactly
