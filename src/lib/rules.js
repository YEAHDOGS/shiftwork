// Shiftwork — eligibility + billing rules. Pure functions, no UI.

import { ADMIN_FEE, OFFICER_RATE, WEEKLY_CAP, weekKey } from "./seed.js";

export { ADMIN_FEE, OFFICER_RATE, WEEKLY_CAP };

export const shiftHours = (s) => (s.endMin - s.startMin) / 60;

export const shiftLabor = (s) => shiftHours(s) * s.assignments.length * s.rate;

export const shiftClientTotal = (s) => shiftLabor(s) * (1 + ADMIN_FEE);

/**
 * Check whether an officer may be assigned to a shift.
 * @returns {{ok:boolean, reasons:string[]}}
 */
export function eligibility(officer, shift, allShifts) {
  const reasons = [];
  if (!officer) return { ok: false, reasons: ["Unknown officer"] };
  if (officer.status !== "active") reasons.push(`Status is "${officer.status}" — must be active`);
  if (!officer.trained) reasons.push("Paid-detail training incomplete");
  if (!officer.fullDuty) reasons.push("Not cleared for full duty");
  if (shift.assignments.includes(officer.id)) reasons.push("Already assigned to this shift");

  const wk = weekKey(shift.date);
  const booked = allShifts
    .filter((s) => s.id !== shift.id && s.status !== "cancelled" && weekKey(s.date) === wk && s.assignments.includes(officer.id))
    .reduce((a, s) => a + shiftHours(s), 0);
  if (booked + shiftHours(shift) > WEEKLY_CAP) {
    reasons.push(`Weekly cap: ${booked.toFixed(1)}h already booked (cap ${WEEKLY_CAP}h)`);
  }
  const clash = allShifts.some(
    (s) =>
      s.id !== shift.id &&
      s.status !== "cancelled" &&
      s.date === shift.date &&
      s.assignments.includes(officer.id) &&
      shift.startMin < s.endMin &&
      s.startMin < shift.endMin
  );
  if (clash) reasons.push("Overlapping assignment on this date");
  return { ok: reasons.length === 0, reasons };
}

/** Group completed shifts into invoices: one per client per ISO week. */
export function buildInvoices(shifts, paidMap) {
  const groups = new Map();
  for (const s of shifts) {
    if (s.status !== "completed" || s.assignments.length === 0) continue;
    const key = s.clientId + "|" + weekKey(s.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  let i = 0;
  return [...groups.entries()]
    .map(([key, list]) => {
      i++;
      const [clientId, wk] = key.split("|");
      list.sort((a, b) => (a.date < b.date ? -1 : 1));
      const labor = list.reduce((a, s) => a + shiftLabor(s), 0);
      const fee = labor * ADMIN_FEE;
      const id = "INV-" + (2600 + i);
      return {
        id,
        clientId,
        week: wk,
        shiftIds: list.map((s) => s.id),
        labor,
        fee,
        total: labor + fee,
        paid: !!paidMap[id],
        start: list[0].date,
        end: list[list.length - 1].date,
      };
    })
    .sort((a, b) => (a.start < b.start ? 1 : -1));
}

/** One payout row per officer per completed shift assignment. */
export function buildPayouts(shifts, paidMap) {
  const rows = [];
  for (const s of shifts) {
    if (s.status !== "completed") continue;
    for (const oid of s.assignments) {
      const key = s.id + ":" + oid;
      const hours = shiftHours(s);
      rows.push({
        key,
        officerId: oid,
        shiftId: s.id,
        date: s.date,
        hours,
        amount: hours * s.rate,
        paid: !!paidMap[key],
      });
    }
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const payoutKey = (shiftId, officerId) => `${shiftId}:${officerId}`;
