// Shiftwork — deterministic fictional test data.
// ALL data here is invented for the demo. No real people, no real agencies.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260916);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

/** ISO date (local) offset by n days from today. */
export function isoDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Monday-based week key for a YYYY-MM-DD date. */
export function weekKey(iso) {
  const d = new Date(iso + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const OFFICER_RATE = 53; // $/hr paid to the officer
export const ADMIN_FEE = 0.10; // 10% program admin fee billed to the client
export const WEEKLY_CAP = 28; // max paid-detail hours per officer per week

const FIRST = ["Marcus", "Priya", "Dan", "Lucia", "James", "Sarah", "Tom", "Aisha", "Chris", "Nina", "Eddie", "Grace", "Sam", "Victor", "Dana", "Ray", "Holly", "Pete", "Maya", "Leo", "Ana", "Ben", "Tara", "Will", "Jess", "Omar", "Kate", "Frank"];
const LAST = ["Webb", "Nair", "Cole", "Fernandez", "Okafor", "Kim", "Becker", "Rahman", "Doyle", "Petrova", "Ramos", "Liu", "Carter", "Hale", "Whitfield", "Mendoza", "Zhang", "Novak", "Thompson", "Fischer", "Ruiz", "Kowalski", "Singh", "Brooks", "Harper", "Haddad", "Sullivan", "Delaney"];
const RANKS = ["Officer", "Officer", "Officer", "Officer", "Sergeant", "Officer", "Detective", "Officer", "Lieutenant", "Officer"];

function shield(i) {
  return "MCPD-" + String(1000 + i * 37).padStart(4, "0");
}

export const OFFICERS = FIRST.map((f, i) => {
  let status = "active";
  if (i === 8 || i === 13) status = "restricted";
  if (i === 21) status = "suspended";
  if (i === 11 || i === 24 || i === 27) status = "leave";
  return {
    id: "off-" + (i + 1),
    name: `${f} ${LAST[i]}`,
    shield: shield(i),
    rank: pick(RANKS),
    status,
    trained: i === 19 || i === 26 ? false : true,
    fullDuty: status === "restricted" || status === "suspended" ? false : true,
    armed: true,
    rate: OFFICER_RATE,
    phone: `(555) 010-${String(1000 + i * 13).slice(-4)}`,
    email: `${f.toLowerCase()}.${LAST[i].toLowerCase()}@example-mail.test`,
  };
});

export const CLIENTS = [
  { id: "cli-1", name: "Harborview Mall", contact: "D. Osei", type: "Retail", email: "ops@harborview.example.test" },
  { id: "cli-2", name: "Downtown Arena", contact: "R. Patel", type: "Events", email: "security@downtownarena.example.test" },
  { id: "cli-3", name: "St. Mercy Hospital", contact: "L. Grant", type: "Healthcare", email: "facilities@stmercy.example.test" },
  { id: "cli-4", name: "Union Bank Tower", contact: "M. Cho", type: "Corporate", email: "prop@unionbanktower.example.test" },
  { id: "cli-5", name: "Riverside Film Studios", contact: "J. Vega", type: "Production", email: "locations@riversidefilm.example.test" },
  { id: "cli-6", name: "Grand Central Market", contact: "A. Diallo", type: "Retail", email: "mgmt@gcmarket.example.test" },
  { id: "cli-7", name: "City Marathon Org", contact: "S. Lindqvist", type: "Events", email: "ops@citymarathon.example.test" },
  { id: "cli-8", name: "TechExpo Convention Center", contact: "K. Byrne", type: "Events", email: "events@techexpo.example.test" },
];

const TITLES = ["Retail patrol", "Event security", "Traffic control", "Lobby detail", "Set security", "Perimeter watch", "Entrance screening", "Overnight patrol"];
const STARTS = [360, 480, 600, 720, 840, 960, 1080]; // 6:00 .. 18:00

export function seedShifts() {
  const shifts = [];
  const weekHours = {}; // officerId -> { weekKey: hours }
  let n = 0;
  const eligiblePool = OFFICERS.filter((o) => o.status === "active" && o.trained && o.fullDuty);

  for (let d = -14; d <= 21; d++) {
    const date = isoDay(d);
    const count = int(1, 3) + (d >= 0 && rand() < 0.35 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      n++;
      const client = pick(CLIENTS);
      const startMin = pick(STARTS);
      const endMin = startMin + pick([4, 6, 8]) * 60;
      const needed = int(1, 4);
      const past = d < 0;
      const shift = {
        id: "sh-" + n,
        clientId: client.id,
        title: pick(TITLES),
        location: client.name,
        date,
        startMin,
        endMin,
        officersNeeded: needed,
        rate: OFFICER_RATE,
        status: past ? "completed" : rand() < 0.55 ? "assigned" : "open",
        assignments: [],
        notes: rand() < 0.2 ? "Client requested early arrival (15 min)." : "",
      };
      const hours = (endMin - startMin) / 60;
      const wk = weekKey(date);
      if (past || shift.status === "assigned") {
        const shuffled = [...eligiblePool].sort(() => rand() - 0.5);
        const target = past ? needed : int(1, needed);
        for (const o of shuffled) {
          if (shift.assignments.length >= target) break;
          const used = (weekHours[o.id] && weekHours[o.id][wk]) || 0;
          if (used + hours > WEEKLY_CAP) continue;
          // avoid double-booking same day
          const clash = shifts.some(
            (s) => s.date === date && s.assignments.includes(o.id) && shift.startMin < s.endMin && s.startMin < shift.endMin
          );
          if (clash) continue;
          shift.assignments.push(o.id);
          weekHours[o.id] = weekHours[o.id] || {};
          weekHours[o.id][wk] = used + hours;
        }
        if (!past && shift.assignments.length < needed) shift.status = "open";
      }
      shifts.push(shift);
    }
  }
  return shifts;
}

export function seedAudit() {
  const now = Date.now();
  return [
    { ts: now - 1000 * 60 * 60 * 26, actor: "system", role: "system", action: "seed", detail: "Demo dataset generated (fictional officers, clients, shifts)." },
    { ts: now - 1000 * 60 * 60 * 9, actor: "D. Osei (Harborview Mall)", role: "client", action: "request", detail: "Submitted detail request: Retail patrol, 4 officers." },
    { ts: now - 1000 * 60 * 60 * 5, actor: "Coordinator", role: "coordinator", action: "assign", detail: "Assigned 4 officers to Harborview Mall retail patrol." },
    { ts: now - 1000 * 60 * 42, actor: "Admin", role: "admin", action: "invoice", detail: "Invoice INV-2607 marked paid ($2,326.40)." },
  ];
}
