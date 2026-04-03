# Incident Report — Prisma Schema Engine Hung Process

## Environment

| Parameter | Value |
|---|---|
| OS | macOS 26.3.1 (Darwin 25.3.0, Build 25D771280a) |
| Architecture | x64 |
| Node.js | v20.12.0 |
| npm | 10.5.0 |
| Prisma CLI | 5.22.0 |
| @prisma/client | 5.22.0 |
| Prisma Engine Hash | `605197351a3c8bdd595af2d2a9bc3025bca48ea2` |
| Schema Engine Binary | `schema-engine-darwin` (at `node_modules/@prisma/engines/schema-engine-darwin`) |
| Query Engine | `libquery_engine-darwin.dylib.node` |
| Database | SQLite 3.x (`prisma/dev.db`) |
| Database size | 49,152 bytes (12 pages) |

---

## Process Details (at time of discovery)

```
PID:     9877
USER:    yechielshirion
%CPU:    118.6
%MEM:    0.0
VSZ:     33,738,648
RSS:     644
TT:      ??
STAT:    R
STARTED: Mon 10PM   (2026-03-30 ~22:00)
TIME:    1398:41.78  (~23.3 hours of CPU time)
COMMAND: /Users/yechielshirion/pocketbank/server/node_modules/@prisma/engines/schema-engine-darwin
         -d /Users/yechielshirion/pocketbank/server/prisma/schema.prisma
```

**Resolution:** Process terminated via `kill 9877` on 2026-03-31.

---

## Project Migration History

### Migration 1 — `20260323203846_init`
**Date:** 2026-03-23 20:38
**Operation:** Initial schema creation — `CREATE TABLE` for all 6 entities.

**Tables created:**
- `Family` — with `loanInterest REAL DEFAULT 0.1`, `investLongInterest REAL DEFAULT 0.1`, `investShortInterest REAL DEFAULT 0.1`
- `User` — with `username UNIQUE`
- `Action`
- `Loan`
- `Invest`
- `Message`

---

### Migration 2 — `20260326204412_update_interest_defaults`
**Date:** 2026-03-26 22:44
**Operation:** `RedefineTables` — altered default values on `Family`.

**SQL executed:**
```sql
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Family" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "loanInterest" REAL NOT NULL DEFAULT 1,
    "investLongInterest" REAL NOT NULL DEFAULT 2,
    "investShortInterest" REAL NOT NULL DEFAULT 1
);

INSERT INTO "new_Family" ("id", "investLongInterest", "investShortInterest", "loanInterest", "name")
SELECT "id", "investLongInterest", "investShortInterest", "loanInterest", "name" FROM "Family";

DROP TABLE "Family";
ALTER TABLE "new_Family" RENAME TO "Family";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
```

**Default value changes:**
| Field | Before | After |
|---|---|---|
| `loanInterest` | 0.1 | 1 |
| `investLongInterest` | 0.1 | 2 |
| `investShortInterest` | 0.1 | 1 |

---

## Git Timeline (relevant commits)

```
2026-03-26 22:50  c534f78  fix: replace ugly toggle buttons with segmented control for short/long term
2026-03-26 22:46  442f5c5  feat: investment lock periods, short/long toggle, updated interest defaults
2026-03-26 00:40  a0a47d0  fix: remove unused unreadCounts state after contacts panel removal
2026-03-26 00:18  f661495  feat: user name in header, child section name, center cards on desktop
2026-03-26 00:02  5136b82  fix: remove contacts sidebar from MessagingHub, single-panel chat
2026-03-25 23:53  84e3e3b  fix: messaging polish, remove Children title, narrow desktop layout
2026-03-25 23:41  c84fa98  fix: center child name on parent cards; expose Vite on local network
2026-03-25 23:35  edee5e1  fix: reduce chat sidebar width so cards are the main content area
2026-03-25 23:08  a748ea7  Step 10B: center name in balance card, move chat to child screen only
2026-03-25 22:23  7e1ec22  Step 10: mobile-first redesign with expandable cards and parent child actions
2026-03-25 21:40  308fa3e  Step 9: WhatsApp-style messaging hub
2026-03-25 15:53  b1903c3  Add placeholder option to message recipient dropdown
2026-03-25 15:41  ade4250  Fix message recipient: always show dropdown regardless of count
2026-03-25 00:03  5b77f8f  Step 7C: auto logout on inactivity and tab close
2026-03-24 23:58  002666e  Step 7B: fix messaging — dynamic recipient selection
2026-03-24 23:57  3150bbd  Step 7A: unify button sizes across all dashboards
2026-03-24 13:12  b7cdaed  Add rule 5: treat unrelated requests as separate prompts
2026-03-24 11:21  1dfaf70  Step 6: add money to child from parent dashboard
2026-03-23 22:29  abae251  Step 5: add setup script and Raspberry Pi deployment guide
2026-03-23 22:15  b91a1a0  Step 4: wire Express to serve React build as static files
```

---

## Database File State (at time of discovery)

```
Path:          server/prisma/dev.db
Size:          49,152 bytes
Pages:         12
Free pages:    1
File counter:  61
Last written:  2026-03-28 23:39
SQLite version used: 3045000
Schema version: 4
Encoding:      UTF-8
```

**Observation:** The database was last written on 2026-03-28 23:39, which is **4 days before** the schema-engine process was killed. The schema-engine process started on 2026-03-30 ~22:00 — meaning the process ran for ~23 hours without writing to the database.

---

## npm Scripts (server/package.json)

```json
{
  "scripts": {
    "dev":          "ts-node-dev --respawn src/index.ts",
    "build":        "tsc",
    "start":        "node dist/index.js",
    "db:generate":  "prisma generate",
    "db:migrate":   "prisma migrate dev"
  }
}
```

---

## Prisma Schema (at time of incident)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Family {
  id                  Int    @id @default(autoincrement())
  name                String
  loanInterest        Float  @default(1)
  investLongInterest  Float  @default(2)
  investShortInterest Float  @default(1)
  users               User[]
}

model User {
  id        Int     @id @default(autoincrement())
  familyId  Int
  firstName String
  lastName  String
  username  String  @unique
  password  String
  isParent  Boolean @default(false)
  balance   Float   @default(0)

  family    Family    @relation(fields: [familyId], references: [id])
  actions   Action[]
  loans     Loan[]
  invests   Invest[]
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
}

model Action {
  id       Int      @id @default(autoincrement())
  userId   Int
  positive Boolean
  type     String
  amount   Float
  start    DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id])
}

model Loan {
  id            Int      @id @default(autoincrement())
  userId        Int
  amount        Float
  currentAmount Float
  interest      Float
  start         DateTime @default(now())
  updatedAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
}

model Invest {
  id            Int      @id @default(autoincrement())
  userId        Int
  amount        Float
  currentAmount Float
  interest      Float
  longTerm      Boolean
  start         DateTime @default(now())
  end           DateTime
  updatedAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
}

model Message {
  id          Int      @id @default(autoincrement())
  senderId    Int
  receiverId  Int
  senderName  String
  content     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  sender      User     @relation("SentMessages",   fields: [senderId],   references: [id])
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
}
```

---

## Key Observations

1. **Process invocation command:** The schema-engine was invoked with a single flag `-d <schema path>`, which is the standard invocation for `prisma migrate dev` or `prisma db push`.

2. **No database writes during process lifetime:** The database file (`dev.db`) was last modified on 2026-03-28 23:39. The process started on 2026-03-30 ~22:00. The process consumed 23+ hours of CPU time without writing to the database.

3. **CPU usage:** 118.6% (above 100% — indicates usage across multiple logical cores).

4. **RSS (Resident Set Size): 644 KB** — extremely low memory footprint despite high CPU usage, suggesting the process was in a CPU-bound loop rather than holding open file handles or database locks.

5. **Process state: R (Running)** — not sleeping, not waiting on I/O. Actively executing code.

6. **No crash or error exit:** The process remained alive with state `R` for the entire duration until manually killed.

7. **Gap between last migration and process start:** Last migration ran on 2026-03-26 22:44. The hung process started on 2026-03-30 ~22:00 — a gap of ~4 days with no database activity.
