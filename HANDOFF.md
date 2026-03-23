# PocketBank — Conversation Handoff

Use this file to bring a new Claude session fully up to speed on the PocketBank project.

---

## Who I Am

- My name is Yechiel Shirion.
- I am rebuilding my old Android + Spring Boot app (EconomiKids) as a modern web app called PocketBank, designed to run on a Raspberry Pi.

---

## Mandatory Rules (Follow Every Session Without Exception)

1. **Commit + push after every prompt** — remote: `https://github.com/yshirion/pocketbank.git`
2. **Plan first, wait for confirmation** — write the plan and wait before doing any work.
3. **Log every change in `flow.md`** — include the step number and motivation.
4. **Correct English grammar** in every message.

---

## Original Project (EconomiKids)

Located at: `/Users/yechielshirion/economikids/`

- **Client:** `EconomiKidsClient/` — Android app, Java, Retrofit
- **Server:** `EconomiKidsServer/` — Spring Boot, MySQL, port 9090

**Domain entities:** User, Family, Action, Loan, Invest, Message

**Key behaviors:**
- Users belong to a Family; each user is either a parent or child
- Family stores interest rates: `loanInterest`, `investLongInterest`, `investShortInterest`
- Loans and investments auto-compound on fetch: `FV = PV × (1 + r/100)^months`
- Actions track all balance changes (positive = income, negative = expense)
- Parent can view children, delete them, or promote them to parent
- Messages sent between family members

**Known issues fixed in PocketBank:**
- Passwords stored in plain text → fixed with bcrypt
- Login credentials passed in URL path → fixed with POST body
- Server IP hardcoded in client → fixed with `.env`
- No authentication/session security → fixed with JWT + httpOnly cookie

---

## Tech Stack (Agreed)

| Layer    | Choice                          | Reason                                            |
|----------|---------------------------------|---------------------------------------------------|
| Backend  | Node.js + TypeScript + Express  | Lightweight, runs well on Pi                      |
| Frontend | React + TypeScript              | Component-based, good for this kind of dashboard  |
| DB       | SQLite + Prisma ORM             | File-based, zero separate process, perfect for Pi |
| Port     | 8080                            | Not 3000, not 80 (no root needed)                 |
| Auth     | JWT (stored in httpOnly cookie) | Stateless, secure                                 |

---

## Project Structure

```
pocketbank/
├── CLAUDE.md              ← rules + overview (always read this)
├── flow.md                ← step-by-step change log
├── HANDOFF.md             ← this file
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── middleware/auth.ts
│   │   ├── routes/        (auth, user, family, action, loan, invest, message)
│   │   └── controllers/   (auth, user, family, action, loan, invest, message)
│   ├── prisma/schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── client/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── context/AuthContext.tsx
    │   ├── services/api.ts
    │   ├── pages/         (Login, RegisterParent, RegisterChild, ParentDashboard, ChildDashboard)
    │   └── components/    (BalanceCard, ActionList, LoanPanel, InvestPanel, MessagePanel)
    ├── vite.config.ts     (proxies /api → localhost:8080)
    ├── package.json
    └── tsconfig.json
```

---

## What Has Been Built (Steps Completed)

### Step 1 — Project Initialization
- Created folder structure, `CLAUDE.md`, `.gitignore`, `flow.md`
- Documented tech stack and security decisions

### Step 2 — Server Foundation
- Express + TypeScript app on port 8080
- Prisma schema with SQLite (6 models)
- JWT auth middleware with httpOnly cookies
- All 7 route + controller files with real logic
- bcrypt password hashing, POST-body auth, Prisma transactions
- Compound interest formula preserved

### Step 3 — React Client
- Vite + React + TypeScript with `/api` proxy to Express
- `AuthContext` — holds `user` and `viewingChild` state
- All API calls centralized in `services/api.ts` with JWT cookie support
- All pages and components built
- Parent can view a child's dashboard in read-only mode

---

## What Comes Next (Not Done Yet)

- **Step 4:** Wire Express to serve the React build as static files (single process for Pi)
- **Step 5:** `.env` setup script + Raspberry Pi deployment guide

---

## How to Run Locally

```bash
# Server
cd server
cp .env.example .env        # fill in JWT_SECRET
npm install
npm run db:migrate
npm run dev                 # runs on port 8080

# Client (separate terminal)
cd client
npm install
npm run dev                 # runs on port 5173, proxies /api to 8080
```

---

## Git Remote

`https://github.com/yshirion/pocketbank.git`
