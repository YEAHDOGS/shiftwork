// QA screenshots: 390px phone + desktop, console error check.
import { chromium } from "playwright-core";

const shots = [
  { name: "dashboard", hash: "#/dashboard" },
  { name: "schedule", hash: "#/schedule" },
  { name: "officers", hash: "#/officers" },
  { name: "billing", hash: "#/billing" },
  { name: "payouts", hash: "#/payouts" },
];

const browser = await chromium.launch({ executablePath: "/opt/meta-chromium/chrome", args: ["--no-sandbox", "--no-proxy-server", "--disable-features=LocalNetworkAccessChecks"] });
const errors = [];

// phone
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
phone.on("console", (m) => { if (m.type() === "error") errors.push(`[${"phone"}] ${m.text()}`); });
phone.on("pageerror", (e) => errors.push(`[phone pageerror] ${e.message}`));
for (const s of shots) {
  await phone.goto(`http://127.0.0.1:8905/${s.hash}`, { waitUntil: "networkidle" });
  await phone.waitForTimeout(600);
  await phone.screenshot({ path: `/tmp/qa/phone-${s.name}.png` });
}
await phone.close();

// desktop spot check
const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desk.on("console", (m) => { if (m.type() === "error") errors.push(`[desk] ${m.text()}`); });
desk.on("pageerror", (e) => errors.push(`[desk pageerror] ${e.message}`));
await desk.goto("http://127.0.0.1:8905/#/schedule", { waitUntil: "networkidle" });
await desk.waitForTimeout(600);
await desk.screenshot({ path: "/tmp/qa/desk-schedule.png" });
await desk.goto("http://127.0.0.1:8905/#/dashboard", { waitUntil: "networkidle" });
await desk.waitForTimeout(600);
await desk.screenshot({ path: "/tmp/qa/desk-dashboard.png" });
await browser.close();

console.log("console errors:", errors.length ? errors : "none");
console.log("done");
