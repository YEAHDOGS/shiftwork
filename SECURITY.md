# SECURITY.md — Shiftwork

## What this is

Shiftwork is a **front-end demo** of a police paid-detail management system.
It runs entirely in the browser against seeded **fictional** test data.
There is no backend, no database, no authentication, and no real data.

## What the demo implements (real controls, demo scope)

- **Role-based views** — Admin, Coordinator, Officer, and Client see different
  navigation and actions. This is UI-level gating for demonstration; a
  production system enforces authorization server-side on every request.
- **Eligibility rules engine** (`src/lib/rules.js`) — pure, testable functions:
  active status, training complete, full-duty clearance, no overlapping
  assignments, 28h weekly cap. Rules live outside the UI so they can be
  unit-tested and reused by a real backend.
- **Append-only audit log** — every mutation (assign, unassign, create,
  status change, invoice/payment toggles) records actor, role, timestamp,
  and detail. In production this log must be tamper-evident and stored
  server-side, not in browser memory.
- **Input hygiene** — an `esc()` helper exists for any future
  string-interpolated rendering; all user input flows through Svelte's
  escaped bindings by default.
- **No secrets** — the codebase contains no API keys, tokens, or credentials.
  Test contact data uses `.example.test` domains and 555 numbers.

## What production would still need

This demo intentionally does **not** satisfy SOC 2 or FedRAMP. A production
version handling real law-enforcement scheduling data would need, at minimum:

- Real authentication (SSO/MFA) and server-side authorization on every endpoint
- Encrypted data at rest and in transit (TLS 1.2+), with a defined key-management story
- A hardened backend + database with backups, rather than in-memory browser state
- Tamper-evident, retained audit logs shipped to a SIEM
- Vulnerability management: dependency scanning, patch SLAs, pen testing
- Incident response plan, change management, and personnel security practices
- For FedRAMP: a formal authorization boundary, NIST 800-53 control
  implementation, 3PAO assessment, and continuous monitoring (ConMon).
  For Texas state buyers: TX-RAMP certification via the Texas DIR.

The rules engine and audit-trail patterns in this demo are designed to carry
over into that production architecture unchanged.
