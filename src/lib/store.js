// Shiftwork — central state, actions, audit trail, role permissions.
import { writable, derived, get } from "svelte/store";
import { OFFICERS, CLIENTS, seedShifts, seedAudit, weekKey, ADMIN_FEE } from "./seed.js";
import { buildInvoices, buildPayouts, shiftHours, eligibility } from "./rules.js";

export const officers = writable(OFFICERS);
export const clients = writable(CLIENTS);
export const shifts = writable(seedShifts());
export const auditLog = writable(seedAudit());
export const invoicePaid = writable({});
export const payoutPaid = writable({});
export const role = writable({ type: "admin", officerId: "off-1", clientId: "cli-1" });

// ---- derived data ----
export const invoices = derived([shifts, invoicePaid], ([$s, $p]) => buildInvoices($s, $p));
export const payouts = derived([shifts, payoutPaid], ([$s, $p]) => buildPayouts($s, $p));

export const officerById = derived(officers, ($o) => Object.fromEntries($o.map((x) => [x.id, x])));
export const clientById = derived(clients, ($c) => Object.fromEntries($c.map((x) => [x.id, x])));
export const shiftById = derived(shifts, ($s) => Object.fromEntries($s.map((x) => [x.id, x])));

export const kpis = derived([officers, shifts, invoices, payouts], ([$o, $s, $inv, $pay]) => {
  const wk = weekKey(new Date().toISOString().slice(0, 10));
  const active = $o.filter((x) => x.status === "active").length;
  const open = $s.filter((x) => x.status === "open").length;
  const weekHrs = $s
    .filter((x) => x.status !== "cancelled" && weekKey(x.date) === wk)
    .reduce((a, x) => a + shiftHours(x) * x.assignments.length, 0);
  const pendingPayout = $pay.filter((p) => !p.paid).reduce((a, p) => a + p.amount, 0);
  const unpaidInv = $inv.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0);
  const understaffed = $s.filter((x) => (x.status === "open" || x.status === "assigned") && x.assignments.length < x.officersNeeded).length;
  return { active, open, weekHrs, pendingPayout, unpaidInv, understaffed };
});

// ---- permissions ----
const ROLE_VIEWS = {
  admin: ["dashboard", "schedule", "officers", "clients", "billing", "payouts", "audit"],
  coordinator: ["dashboard", "schedule", "officers", "clients", "billing", "payouts"],
  officer: ["dashboard", "schedule", "payouts"],
  client: ["dashboard", "clients", "billing", "schedule"],
};
export const canView = (view) => ROLE_VIEWS[get(role).type].includes(view);
export const canManage = () => ["admin", "coordinator"].includes(get(role).type);
export const canAudit = () => get(role).type === "admin";

// ---- audit ----
function actorLabel() {
  const r = get(role);
  if (r.type === "officer") return (get(officerById)[r.officerId]?.name || "Officer") + " (officer)";
  if (r.type === "client") return (get(clientById)[r.clientId]?.name || "Client") + " (client)";
  return r.type === "admin" ? "Admin" : "Coordinator";
}
export function log(action, detail) {
  const r = get(role);
  auditLog.update((a) => [{ ts: Date.now(), actor: actorLabel(), role: r.type, action, detail }, ...a]);
}

// ---- actions ----
export function assignOfficer(shiftId, officerId) {
  const $shifts = get(shifts);
  const shift = $shifts.find((s) => s.id === shiftId);
  const officer = get(officers).find((o) => o.id === officerId);
  const check = eligibility(officer, shift, $shifts);
  if (!check.ok) return check;
  shifts.update((ss) =>
    ss.map((s) => {
      if (s.id !== shiftId) return s;
      const assignments = [...s.assignments, officerId];
      return { ...s, assignments, status: assignments.length >= s.officersNeeded ? "assigned" : "open" };
    })
  );
  log("assign", `${officer.name} assigned to "${shift.title}" at ${shift.location} (${shift.date}).`);
  return { ok: true, reasons: [] };
}

export function unassignOfficer(shiftId, officerId) {
  const $shifts = get(shifts);
  const shift = $shifts.find((s) => s.id === shiftId);
  const officer = get(officers).find((o) => o.id === officerId);
  shifts.update((ss) =>
    ss.map((s) => {
      if (s.id !== shiftId) return s;
      const assignments = s.assignments.filter((id) => id !== officerId);
      return { ...s, assignments, status: assignments.length === 0 ? "open" : assignments.length >= s.officersNeeded ? "assigned" : "open" };
    })
  );
  log("unassign", `${officer?.name || officerId} removed from "${shift.title}" (${shift.date}).`);
}

export function createShift(input) {
  const id = "sh-u" + Date.now().toString(36);
  const shift = {
    id,
    clientId: input.clientId,
    title: input.title,
    location: input.location,
    date: input.date,
    startMin: input.startMin,
    endMin: input.endMin,
    officersNeeded: input.officersNeeded,
    rate: 53,
    status: "open",
    assignments: [],
    notes: input.notes || "",
  };
  shifts.update((ss) => [...ss, shift]);
  const client = get(clients).find((c) => c.id === input.clientId);
  log("create", `Shift created: "${shift.title}" for ${client?.name} on ${shift.date}.`);
  return id;
}

export function setShiftStatus(shiftId, status) {
  shifts.update((ss) => ss.map((s) => (s.id === shiftId ? { ...s, status } : s)));
  const s = get(shifts).find((x) => x.id === shiftId);
  log("status", `Shift "${s.title}" (${s.date}) marked ${status}.`);
}

export function toggleInvoicePaid(invId) {
  const inv = get(invoices).find((i) => i.id === invId);
  invoicePaid.update((m) => ({ ...m, [invId]: !m[invId] }));
  const client = get(clients).find((c) => c.id === inv.clientId);
  log("invoice", `Invoice ${invId} (${client?.name}) marked ${!inv.paid ? "paid" : "unpaid"}.`);
}

export function togglePayoutPaid(key) {
  payoutPaid.update((m) => ({ ...m, [key]: !m[key] }));
  const [shiftId, officerId] = key.split(":");
  const officer = get(officers).find((o) => o.id === officerId);
  const shift = get(shifts).find((s) => s.id === shiftId);
  log("payout", `Payout for ${officer?.name} — "${shift?.title}" (${shift?.date}) marked ${!get(payoutPaid)[key] ? "paid" : "unpaid"}.`);
}

export function payAllOfficer(officerId) {
  const keys = get(payouts).filter((p) => p.officerId === officerId && !p.paid).map((p) => p.key);
  if (!keys.length) return 0;
  payoutPaid.update((m) => Object.fromEntries([...Object.entries(m), ...keys.map((k) => [k, true])]));
  const officer = get(officers).find((o) => o.id === officerId);
  log("payout", `All ${keys.length} pending payouts for ${officer?.name} marked paid.`);
  return keys.length;
}

export function seedPayoutPaid() {
  // Mark most historical payouts paid so the demo has a realistic mix.
  const rows = get(payouts);
  const m = {};
  rows.forEach((p, i) => { if (i % 10 < 7) m[p.key] = true; });
  payoutPaid.set(m);
  const invs = get(invoices);
  const im = {};
  invs.forEach((v, i) => { if (i % 10 < 6) im[v.id] = true; });
  invoicePaid.set(im);
}
