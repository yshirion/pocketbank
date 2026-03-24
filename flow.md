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

---

## Step 3 — React Client
**What:** Built the complete React + TypeScript client using Vite. Includes all pages, components, auth context, and API service layer.
**Why:** The server is now fully functional; the client gives it a usable interface that runs in any browser on the local network.

**Files created:**
- `vite.config.ts` — proxies `/api/*` to `localhost:8080` to avoid CORS issues in dev
- `context/AuthContext.tsx` — replaces the Android `CalcKidsApplication` singleton; holds current user and "viewing child" state
- `services/api.ts` — all Axios calls in one place; uses `withCredentials` so the JWT cookie is sent automatically
- `pages/` — Login, RegisterParent, RegisterChild, ParentDashboard, ChildDashboard
- `components/` — BalanceCard, ActionList, LoanPanel, InvestPanel, MessagePanel

**Key decisions:**
- No CSS framework — plain CSS modules to keep the Pi footprint small
- `readOnly` prop on LoanPanel and InvestPanel — parent can view but not act on a child's account
- Family ID shown on parent dashboard so parents can share it with their children for registration

---

## Step 4 — Single-Process Deployment (Express Serves React)
**What:** Wired Express to serve the React build as static files. Added a root `package.json` with `build` and `start` scripts.
**Why:** On the Raspberry Pi only one process should run. Instead of running Express and a separate static file server, Express itself serves `client/dist` — the compiled React app.

**Changes:**
- `server/src/index.ts` — added `path` import; added `express.static` and catch-all `index.html` route after all API routes
- `package.json` (root) — created with `build` (builds client then server) and `start` (runs server) scripts

---

## Step 5 — Raspberry Pi Deployment
**What:** Created `setup.sh` (one-command setup script) and `DEPLOY.md` (Pi deployment guide).
**Why:** The Pi needs a simple, reproducible way to go from a fresh `git clone` to a running app without manual steps.

**Changes:**
- `setup.sh` — auto-creates `server/.env` with a generated `JWT_SECRET`, installs deps, migrates DB, builds client + server
- `DEPLOY.md` — covers prerequisites, first-time setup, updating, and systemd auto-start on boot

---

## Step 7A — Unified Button Sizes
**What:** Standardized all buttons to the same size across all CSS files.
**Why:** Buttons had inconsistent padding and font sizes; only color should differ by role.

**Changes:** `Dashboard.module.css`, `Panel.module.css` — all buttons now use `padding: 0.4rem 0.85rem`, `font-size: 0.875rem`, `font-weight: 600`, `border-radius: 8px`.

---

## Step 7B — Fix Messaging (Recipient Selection)
**What:** Fixed messaging so parent can send to a specific child, and child can send to a parent. Previously all messages were sent to self.
**Why:** `MessagePanel` had a hardcoded `receiverId` that pointed to the wrong user in all cases.

**Changes:**
- `MessagePanel.tsx` — removed `receiverId` prop; added `familyId`, `isParent`, `readOnly` props; fetches recipients dynamically (parents for children, children for parents); shows a dropdown when multiple recipients exist; hides send form when `readOnly`
- `ParentDashboard.tsx`, `ChildDashboard.tsx` — updated `MessagePanel` call with correct props

---

## Step 6 — Add Money to Child (Parent Dashboard)
**What:** Added an "Add Money" inline form per child on the Parent Dashboard.
**Why:** Parents had no way to credit or debit a child's balance from the UI. The server API already supported it; only the UI was missing.

**Changes:**
- `ParentDashboard.tsx` — "Add Money" button per child; inline form with amount, description, and +/− toggle; calls `createAction` on save
- `Dashboard.module.css` — added `.moneyForm`, `.moneyToggle`, `.moneyInput`, `.activePos`, `.activeNeg`, `.childRow` styles
