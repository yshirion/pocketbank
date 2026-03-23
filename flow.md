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
