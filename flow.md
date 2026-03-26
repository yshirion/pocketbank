# PocketBank — Flow Log

## Step 16 — Investment Lock Period + Interest Defaults
**What:** Replaced manual end-date picker with Short/Long toggle; server computes lock period (1 or 6 months). Release button disabled until maturity. Updated default interest rates to 1%/1%/2%. Removed name from BalanceCard header.
**Why:** Manual date entry was error-prone. Lock periods enforce the savings discipline. Defaults of 0.1% were unrealistically low.

**Changes:**
- `BalanceCard.tsx` — removed `name` prop and display; `ChildDashboard.tsx` updated accordingly
- `InvestPanel.tsx` — Short/Long toggle buttons replace date input; Release button only shows when `now ≥ end`; locked investments show "from [date]"
- `invest.controller.ts` — `createInvest` computes `end` from `longTerm` (1 or 6 months); `withdrawInvests` rejects if not matured
- `api.ts` — removed `end` from `createInvest` signature
- `schema.prisma` — defaults: `loanInterest=1`, `investShortInterest=1`, `investLongInterest=2`
- Existing Shirion family updated in DB via SQL
- Client rebuilt

---

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

## Step 7C — Auto Logout (Inactivity + Session Cookie)
**What:** Users are logged out after 10 minutes of inactivity or when they close the tab.
**Why:** Standard security practice for a financial app — prevents leaving an open session unattended.

**How it works:**
- Session cookie (no `maxAge`): browser deletes the cookie automatically when the tab/window closes
- JWT expiry reduced from 7 days to 12 hours as a server-side safety net
- Inactivity timer in `AuthContext`: resets on any mouse/keyboard/scroll/touch event; after 10 minutes of silence it calls `logout()` and sets `user` to null, which the router catches and redirects to `/login`

**Changes:**
- `auth.controller.ts` — removed `maxAge` from cookie; changed JWT `expiresIn` from `7d` to `12h`
- `AuthContext.tsx` — added 10-minute inactivity timer with activity event listeners

---

## Step 9 — WhatsApp-Style Messaging Hub
**What:** Replaced the basic `MessagePanel` with a full two-panel chat interface.
**Why:** The old panel had no conversation view, no visual distinction between senders, and no unread indicators.

**How it works:**
- Left panel: contact list with red unread count badge per contact
- Right panel: chat bubbles — my messages left/gray, theirs right/green, unread theirs get yellow border
- Opening a conversation marks their messages as read automatically
- Header badge shows total unread count across all conversations
- When parent views a child's dashboard, messaging is hidden (parent sends from their own dashboard)

**Changes:**
- `message.controller.ts` — added `getConversation` (messages between two users) and `getUnreadCounts` (unread count per sender)
- `routes/message.ts` — added two new routes
- `api.ts` — added `getConversation`, `getUnreadCounts`
- New `MessagingHub.tsx` + `MessagingHub.module.css`
- `ParentDashboard.tsx`, `ChildDashboard.tsx` — swapped `MessagePanel` for `MessagingHub`, added header unread badge
- `Dashboard.module.css` — added `.unreadBadge` style

---

## Step 10B — Center Name + Messaging Fix
**What:** Centered the child's name in the BalanceCard header; moved the chat from the parent dashboard to the child screen only.
**Why:** Name was left-aligned, which looked off on mobile. Chat was shown on the parent's own dashboard, but the correct UX is to access it only from the child screen (parent sees their own perspective there).

**Changes:**
- `BalanceCard.module.css` — header changed to column/center layout; chevron absolutely positioned at the right edge
- `BalanceCard.tsx` — removed wrapper divs; name, label, amount stacked and centered
- `ParentDashboard.tsx` — removed `MessagingHub`, `totalUnread` state, and unread badge
- `ChildDashboard.tsx` — `MessagingHub` always visible (both for child's own view and parent's view); parent view uses `userId={user!.id}` + `isParent={true}`; unread badge shown for both viewing modes

---

## Step 10 — Mobile-First Redesign
**What:** Complete redesign of both dashboards optimized for phone browsers, with expandable cards and a responsive chat layout.
**Why:** The main use case is a phone browser; the previous layout had flat lists and non-collapsible panels that did not work well on small screens.

**Parent screen:**
- Children rendered as tappable cards (name + balance); tap the card body to navigate to the child's screen
- "Add Money" button inline on each card; expands a form inside the card

**Child screen:**
- Three expandable summary cards: Balance (tap to see transaction history, expenses in red, income in green), Loans (tap to request/repay; parent can give loans), Investments (tap to invest short/long; parent can release)
- When parent is viewing a child: "Remove Child" and "Make Parent" action bar appears below the header
- Chat: bottom of screen on mobile, sticky right sidebar on desktop (≥768 px)

**Promote-to-parent now clears data:** Server deletes all actions, loans, and investments for the child and resets balance to 0 before setting `isParent: true` — all in a single Prisma transaction.

**Changes:**
- `server/src/controllers/user.controller.ts` — `promoteToParent` now clears child data in a transaction
- `client/src/components/BalanceCard.tsx` + `BalanceCard.module.css` — rewritten as expandable blue-header card with lazy-loaded transaction list
- `client/src/components/LoanPanel.tsx` — rewritten as expandable card; `isParent` prop switches between "Give Loan" (parent) and "Request Loan" + "Repay" (child)
- `client/src/components/InvestPanel.tsx` — rewritten as expandable card; `isParent` shows per-item "Release" buttons instead of the invest form
- `client/src/components/Panel.module.css` — added expandable card CSS classes
- `client/src/pages/ParentDashboard.tsx` — children rendered as cards; promote/delete moved to child screen
- `client/src/pages/ChildDashboard.tsx` — expandable layout with responsive sidebar; parent action bar with remove/promote buttons
- `client/src/pages/Dashboard.module.css` — added child card, parent action bar, and responsive layout styles

---

## Step 15 — Header Names + Child Section Name + Cards Centered
**What:** Added logged-in user's name to header center on both pages; added child's name above the cards column; centered cards on desktop; centered "Messages" title.
**Why:** Headers showed no user identity. Cards were left-aligned on wide screens.

**Changes:**
- `Dashboard.module.css` — added `.headerName` (absolutely centered in header); added `.childSectionName`; `.childCards` max-width 480px; `justify-content: center` on desktop layout
- `ChildDashboard.tsx` — added `headerName` span + `childSectionName` div above cards
- `ParentDashboard.tsx` — replaced family subtitle with `headerName`
- `MessagingHub.module.css` — `text-align: center` on `.chatTitle`

---

## Step 14 — Remove Contacts Sidebar from MessagingHub
**What:** Removed the contacts list panel from MessagingHub; chat is now full-width with only a "Messages" title.
**Why:** The contacts panel was redundant — in this app's context (parent viewing one child, or child with one parent) only one contact exists. The name header above the chat was also removed.

**Changes:**
- `MessagingHub.tsx` — removed contacts `<div>` from JSX; added `chatTitle` div; kept contacts loading for auto-select
- `MessagingHub.module.css` — removed all contacts/sidebar CSS; added `.chatTitle`; made `.hub` single-column; chat background `#edf2f7`

---

## Step 13 — Messaging Polish + Layout Fixes
**What:** Removed chat contact-name header; added chat background and date separators in Israel time; removed "Children" title on parent screen; narrowed desktop layout.
**Why:** The contact name header was redundant (already visible in the contacts list). Chat needed visual separation. Times were showing in wrong timezone.

**Changes:**
- `MessagingHub.tsx` — removed `chatHeader`; date separators per day (he-IL / Asia/Jerusalem); time uses Israel timezone
- `MessagingHub.module.css` — removed `.chatHeader`; added `background: #edf2f7` to `.messages`; added `.dateSeparator`
- `ParentDashboard.tsx` — removed "Children" `<h2>`
- `Dashboard.module.css` — `childLayoutWithChat` max-width reduced from `1100px` to `880px`

---

## Step 12 — Center Child Name + Local Network Access
**What:** Centered the child's name in the parent-screen child cards; exposed Vite dev server on the local network.
**Why:** Name was left-aligned with balance on the right. Network access allows testing on a phone browser (same Wi-Fi).

**Changes:**
- `Dashboard.module.css` — `.childCardNav` changed from row `space-between` to column `center`
- `vite.config.ts` — added `host: true` so Vite listens on `0.0.0.0`; phone accesses via `http://172.20.10.2:5173`

---

## Step 11 — Sidebar Width Fix (Cards as Main Area)
**What:** Reduced the chat sidebar from 360px to 300px on desktop.
**Why:** At small desktop widths (~800px), the 360px sidebar was nearly as wide as the cards column, making the chat look like the main content. Cards should always dominate.

**Changes:**
- `Dashboard.module.css` — `.childSidebar` desktop width changed from `360px` to `300px`

---

## Step 6 — Add Money to Child (Parent Dashboard)
**What:** Added an "Add Money" inline form per child on the Parent Dashboard.
**Why:** Parents had no way to credit or debit a child's balance from the UI. The server API already supported it; only the UI was missing.

**Changes:**
- `ParentDashboard.tsx` — "Add Money" button per child; inline form with amount, description, and +/− toggle; calls `createAction` on save
- `Dashboard.module.css` — added `.moneyForm`, `.moneyToggle`, `.moneyInput`, `.activePos`, `.activeNeg`, `.childRow` styles
