# Shiftwork — Paid Detail Management (demo)

A working demo of a police **paid detail** management system: the "calendar"
behind off-duty officer scheduling. Built to show what a modern replacement
for legacy detail-management processes looks like.

**Live:** https://shiftwork.dogs.red · **All data is fictional.**

## What it does

- **Dashboard** — KPIs (active officers, open shifts, weekly hours, pending
  payouts), 14-day hours chart, understaffed-shift alerts, upcoming shifts
- **Schedule** — week calendar (stacked days on mobile, 7-column grid on
  desktop); shift detail drawer with staffing, eligibility-checked assignment,
  start/complete/cancel lifecycle, and new-shift creation
- **Officers** — searchable roster with status (active / restricted /
  suspended / leave), weekly hours vs. 28h cap, assignments, earnings
- **Clients** — vendor directory, detail-request intake form, per-client
  shift history and billed totals
- **Billing** — invoices grouped per client per week: labor + 10% program
  admin fee, with line items and paid/unpaid tracking
- **Payouts** — per-officer pay ledger with pending totals, one-tap pay,
  pay-all, and YTD (1099-style) accumulation
- **Audit log** — append-only record of every action, admin-only view

**Role switcher** (header): view the system as Admin, Coordinator, Officer,
or Client — navigation and permissions change accordingly.

## Eligibility rules (enforced at assignment)

Active status · paid-detail training complete · full-duty clearance ·
no overlapping assignment · 28h weekly cap. Ineligibility reasons are shown
inline so coordinators see *why*, not just *no*.

## Stack

Svelte 5 + Vite + Tailwind CSS 4 · zero runtime dependencies beyond the
template · hash routing (works on any static host) · deterministic seeded
test data (`src/lib/seed.js`).

## Security

See [SECURITY.md](SECURITY.md). Demo-only: no backend, no auth, no real data.

---

Made by DOGS — https://wearedogs.net
