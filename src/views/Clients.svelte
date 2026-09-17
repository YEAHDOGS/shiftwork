<script>
  import { clients, shifts, invoices, role, clientById, createShift, canManage } from "../lib/store.js";
  import { fmtMoney, fmtDate, fmtRange } from "../lib/format.js";
  import { shiftHours, shiftClientTotal } from "../lib/rules.js";
  import { isoDay } from "../lib/seed.js";
  import Badge from "../components/Badge.svelte";
  import Drawer from "../components/Drawer.svelte";
  import { Building2, Plus } from "@lucide/svelte";

  const manage = canManage();
  const r = $derived($role);
  const myClient = $derived(r.type === "client" ? r.clientId : null);

  let selected = $state(null);
  let requesting = $state(false);

  const visible = $derived($clients.filter((c) => (myClient ? c.id === myClient : true)));
  const sel = $derived($clients.find((c) => c.id === selected) || null);
  const selShifts = $derived(sel ? $shifts.filter((s) => s.clientId === sel.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : []);
  const selInvoices = $derived(sel ? $invoices.filter((i) => i.clientId === sel.id) : []);
  const selBilled = $derived(selInvoices.reduce((a, i) => a + i.total, 0));
  const selOpen = $derived(selShifts.filter((s) => s.status === "open" || s.status === "assigned").length);

  let f = $state({ title: "Event security", location: "", date: isoDay(2), startMin: 480, endMin: 960, officersNeeded: 3, notes: "" });
  function submitRequest() {
    const cid = myClient || (sel ? sel.id : $clients[0].id);
    const client = $clientById[cid];
    createShift({ clientId: cid, title: f.title, location: f.location.trim() || client.name, date: f.date, startMin: +f.startMin, endMin: +f.endMin, officersNeeded: +f.officersNeeded, notes: f.notes });
    requesting = false;
    f = { title: "Event security", location: "", date: isoDay(2), startMin: 480, endMin: 960, officersNeeded: 3, notes: "" };
  }
  const HOURS = Array.from({ length: 19 }, (_, i) => (i + 5) * 60);
  const hourLabel = (h) => `${h === 720 ? "12" : h > 720 ? h / 60 - 12 : h / 60}:00 ${h >= 720 ? "PM" : "AM"}`;
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Clients</h1>
      <p class="text-sm text-neutral-400 mt-0.5">Vendors requesting paid details</p>
    </div>
    <button onclick={() => (requesting = true)} class="h-11 px-4 rounded-xl bg-[#ff3344] text-white text-sm font-semibold hover:bg-[#e62e3d] flex items-center gap-1.5">
      <Plus size={16} /> <span class="hidden sm:inline">New request</span><span class="sm:hidden">Request</span>
    </button>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {#each visible as c}
      {@const cs = $shifts.filter((s) => s.clientId === c.id)}
      {@const open = cs.filter((s) => s.status === "open" || s.status === "assigned").length}
      <button onclick={() => (selected = c.id)} class="text-left p-4 rounded-2xl bg-[#0e0e12]/80 border border-white/5 hover:border-[#ff3344]/30">
        <div class="flex items-center gap-2.5">
          <span class="w-10 h-10 rounded-xl bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-[#ff5c6c] shrink-0"><Building2 size={18} /></span>
          <div class="min-w-0">
            <div class="text-sm font-bold truncate">{c.name}</div>
            <div class="text-xs text-neutral-500">{c.type} · {c.contact}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <Badge status={`${open} active`} tone={open ? "open" : "completed"} />
          <span class="text-xs text-neutral-500">{cs.length} shifts all-time</span>
        </div>
      </button>
    {/each}
  </div>
</div>

<Drawer open={!!sel} title={sel ? sel.name : ""} onclose={() => (selected = null)}>
  {#if sel}
    <div class="flex flex-col gap-4">
      <dl class="text-sm grid grid-cols-[110px_1fr] gap-y-1.5">
        <dt class="text-neutral-500">Contact</dt><dd>{sel.contact}</dd>
        <dt class="text-neutral-500">Email</dt><dd class="break-all">{sel.email}</dd>
        <dt class="text-neutral-500">Type</dt><dd>{sel.type}</dd>
        <dt class="text-neutral-500">Billed to date</dt><dd class="font-semibold">{fmtMoney(selBilled)}</dd>
        <dt class="text-neutral-500">Active shifts</dt><dd>{selOpen}</dd>
      </dl>
      <div>
        <h3 class="text-sm font-bold mb-2">Recent shifts</h3>
        <ul class="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {#each selShifts.slice(0, 15) as s}
            <li class="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium truncate">{s.title}</span>
                <Badge status={s.status} />
              </div>
              <div class="text-xs text-neutral-500 mt-0.5">{fmtDate(s.date)} · {fmtRange(s.startMin, s.endMin)} · {s.assignments.length}/{s.officersNeeded} staffed</div>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</Drawer>

<Drawer open={requesting} title="New detail request" onclose={() => (requesting = false)}>
  <div class="flex flex-col gap-3">
    {#if !myClient}
      <p class="text-xs text-neutral-500">Filed under <span class="text-neutral-300 font-medium">{sel?.name || $clients[0].name}</span>. Coordinators triage it into the schedule.</p>
    {:else}
      <p class="text-xs text-neutral-500">Filed as {$clientById[myClient]?.name}. A coordinator will staff it.</p>
    {/if}
    <label class="text-sm flex flex-col gap-1.5">Detail type
      <input bind:value={f.title} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <label class="text-sm flex flex-col gap-1.5">Location
      <input bind:value={f.location} placeholder="e.g. Gate B, north lot" class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <label class="text-sm flex flex-col gap-1.5">Date
      <input type="date" bind:value={f.date} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <div class="grid grid-cols-2 gap-3">
      <label class="text-sm flex flex-col gap-1.5">Start
        <select bind:value={f.startMin} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          {#each HOURS as h}<option value={h}>{hourLabel(h)}</option>{/each}
        </select>
      </label>
      <label class="text-sm flex flex-col gap-1.5">End
        <select bind:value={f.endMin} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          {#each HOURS as h}<option value={h}>{hourLabel(h)}</option>{/each}
        </select>
      </label>
    </div>
    <label class="text-sm flex flex-col gap-1.5">Officers needed
      <input type="number" min="1" max="20" bind:value={f.officersNeeded} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <label class="text-sm flex flex-col gap-1.5">Notes
      <textarea bind:value={f.notes} rows="2" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm"></textarea>
    </label>
    <button onclick={submitRequest} class="h-12 rounded-xl bg-[#ff3344] text-white text-sm font-bold hover:bg-[#e62e3d]">Submit request</button>
  </div>
</Drawer>
