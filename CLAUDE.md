# PocketBank — Claude Instructions

## Mandatory Collaboration Rules

> Follow these in **every session**, without exception.

1. **Commit + push after every prompt** — once the remote repo is set up. Remote: `https://github.com/yshirion/pocketbank.git`
2. **Plan first, wait for confirmation** — before doing any work, write the plan and wait for your confirmation.
3. **Log every change in `flow.md`** — include the step number and motivation.
4. **Correct English grammar** in every message.
5. **Treat unrelated requests as separate prompts** — if a single message contains two unrelated things, handle each independently: separate plan, separate commit, and optionally a separate branch.

---

## Project Overview

**PocketBank** is a full rewrite of the EconomiKids Android + Spring Boot app as a web app, designed to run on a Raspberry Pi.

Original codebase: `/Users/yechielshirion/economikids/`

---

## Tech Stack

| Layer    | Choice                          | Reason                                             |
|----------|---------------------------------|----------------------------------------------------|
| Backend  | Node.js + TypeScript + Express  | Lightweight, runs well on Pi                       |
| Frontend | React + TypeScript              | Component-based, good for this kind of dashboard   |
| DB       | SQLite + Prisma ORM             | File-based, zero separate process, perfect for Pi  |
| Port     | 8080                            | Not 3000, not 80 (no root needed)                  |
| Auth     | JWT (stored in httpOnly cookie) | Stateless, secure                                  |

---

## Security Fixes (vs. EconomiKids)

| Issue               | Fix                                  |
|---------------------|--------------------------------------|
| Plaintext passwords | bcrypt hashing before storing        |
| Credentials in URL  | All auth via POST request body       |
| Hard-coded IP       | `.env` file with `HOST` / `PORT` variables |
| No session security | JWT with expiry + httpOnly cookies   |

---

## Project Structure

```
pocketbank/
├── server/
│   ├── src/
│   │   ├── controllers/     (user, family, action, loan, invest, message)
│   │   ├── routes/
│   │   ├── middleware/      (auth JWT, validation)
│   │   └── index.ts         (Express app, port 8080)
│   ├── prisma/
│   │   └── schema.prisma    (SQLite schema)
│   └── package.json
│
└── client/
    ├── src/
    │   ├── pages/           (Login, Register, ParentDashboard, ChildDashboard)
    │   ├── components/      (Cards, Modals, Tables)
    │   ├── services/        (API calls)
    │   └── context/         (AuthContext — replaces the app singleton)
    └── package.json
```

The Express server serves the React build as static files — only one process runs on the Pi.

---

## Domain Entities to Preserve

All 6 entities from EconomiKids must be carried over:

- **User** — belongs to a Family; role is either `parent` or `child`
- **Family** — stores `loanInterest`, `investLongInterest`, `investShortInterest`
- **Action** — tracks all balance changes (positive = income, negative = expense)
- **Loan** — auto-compounds on fetch: `FV = PV × (1 + r/100)^months`
- **Invest** — same compound formula, short vs. long interest rates
- **Message** — sent between family members

Parent permissions: view children, delete them, promote to parent, delete child's loans/investments.

---

## Security Review Rule

When walking through code with the user, flag any security issue encountered — treat the app as a standard production web app (not enterprise-scale, but not "it's just a home app" either). Flag the issue inline during the explanation, clearly marked as a security note.
