// Shiftwork — formatting helpers.

export const fmtMoney = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const fmtHours = (h) => `${h % 1 === 0 ? h : h.toFixed(1)}h`;

export function fmtDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function fmtDateLong(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function fmtTime(min) {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;

export function fmtTs(ts) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export const initials = (name) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
