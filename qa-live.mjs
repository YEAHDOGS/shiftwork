// QA screenshots against the live public URL, via the egress proxy.
import { chromium } from "playwright-core";

const proxyUrl = new URL(process.env.https_proxy);
const shots = [
  { name: "dashboard", hash: "#/dashboard" },
  { name: "schedule", hash: "#/schedule" },
  { name: "officers", hash: "#/officers" },
  { name: "billing", hash: "#/billing" },
  { name: "payouts", hash: "#/payouts" },
];

const browser = await chromium.launch({
  executablePath: "/opt/meta-chromium/chrome",
  args: ["--no-sandbox", "--proxy-server=http://127.0.0.1:8899", "--ignore-certificate-errors"],
});
const errors = [];

const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
phone.on("console", (m) => { if (m.type() === "error") errors.push(`[phone] ${m.text()}`); });
phone.on("pageerror", (e) => errors.push(`[phone pageerror] ${e.message}`));
for (const s of shots) {
  await phone.goto(`https://yeahdogs.github.io/shiftwork/${s.hash}`, { waitUntil: "networkidle" });
  await phone.waitForTimeout(800);
  await phone.screenshot({ path: `/tmp/qa/phone-${s.name}.png` });
}
await phone.close();

const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desk.on("console", (m) => { if (m.type() === "error") errors.push(`[desk] ${m.text()}`); });
desk.on("pageerror", (e) => errors.push(`[desk pageerror] ${e.message}`));
await desk.goto("https://yeahdogs.github.io/shiftwork/#/schedule", { waitUntil: "networkidle" });
await desk.waitForTimeout(800);
await desk.screenshot({ path: "/tmp/qa/desk-schedule.png" });
await desk.goto("https://yeahdogs.github.io/shiftwork/#/dashboard", { waitUntil: "networkidle" });
await desk.waitForTimeout(800);
await desk.screenshot({ path: "/tmp/qa/desk-dashboard.png" });
await browser.close();

console.log("console errors:", errors.length ? errors : "none");
console.log("done");
