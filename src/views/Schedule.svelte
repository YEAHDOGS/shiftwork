<script>
  import { shifts, officers, clients, role, officerById, clientById, assignOfficer, unassignOfficer, createShift, setShiftStatus, canManage } from "../lib/store.js";
  import { fmtDate, fmtDateLong, fmtRange, fmtHours, initials, esc } from "../lib/format.js";
  import { shiftHours, eligibility } from "../lib/rules.js";
  import { isoDay, CLIENTS } from "../lib/seed.js";
  import Badge from "../components/Badge.svelte";
  import Drawer from "../components/Drawer.svelte";
  import { ChevronLeft, ChevronRight, Plus, X, TriangleAlert } from "@lucide/svelte";

  let weekOffset = $state(0);
  let selected = $state(null); // shift id in drawer
  let creating = $state(false);
  let assignPick = $state("");
  let assignError = $state("");

  const manage = canManage();
  const r = $derived($role);
  const myOfficer = $derived(r.type === "officer" ? r.officerId : null);

  const days = $derived(Array.from({ length: 7 }, (_, i) => {
    // Monday of current week + offset
    const today = new Date();
    const dow = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + weekOffset * 7 + i);
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const d = String(monday.getDate()).padStart(2, "0");
    return `${monday.getFullYear()}-${m}-${d}`;
  }));

  const shiftsFor = (date) => $shifts
    .filter((s) => s.date === date && (myOfficer ? s.assignments.includes(myOfficer) : true))
    .sort((a, b) => a.startMin - b.startMin);

  const sel = $derived($shifts.find((s) => s.id === selected) || null);
  const selClient = $derived(sel ? $clientById[sel.clientId] : null);

  const eligibleList = $derived(sel ? $officers.map((o) => ({ o, check: eligibility(o, sel, $shifts) })) : []);

  function openShift(id) { selected = id; assignPick = ""; assignError = ""; }
  function doAssign() {
    if (!assignPick) return;
    const res = assignOfficer(selected, assignPick);
    if (!res.ok) assignError = res.reasons.join(" ");
    else { assignPick = ""; assignError = ""; }
  }

  // new-shift form state
  let f = $state({ clientId: CLIENTS[0].id, title: "Retail patrol", location: "", date: isoDay(1), startMin: 480, endMin: 960, officersNeeded: 2, notes: "" });
  function submitNew() {
    const loc = f.location.trim() || $clientById[f.clientId]?.name || "";
    createShift({ ...f, location: loc, startMin: +f.startMin, endMin: +f.endMin, officersNeeded: +f.officersNeeded });
    creating = false;
    f = { clientId: CLIENTS[0].id, title: "Retail patrol", location: "", date: isoDay(1), startMin: 480, endMin: 960, officersNeeded: 2, notes: "" };
  }
  const HOURS = Array.from({ length: 19 }, (_, i) => (i + 5) * 60); // 5:00..23:00
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Schedule</h1>
      <p class="text-sm text-neutral-400 mt-0.5">
        {weekOffset === 0 ? "This week" : fmtDate(days[0]) + " – " + fmtDate(days[6])}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button onclick={() => weekOffset--} aria-label="Previous week" class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><ChevronLeft size={18} /></button>
      <button onclick={() => (weekOffset = 0)} class="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10">Today</button>
      <button onclick={() => weekOffset++} aria-label="Next week" class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><ChevronRight size={18} /></button>
      {#if manage}
        <button onclick={() => (creating = true)} class="h-11 px-4 rounded-xl bg-[#ff3344] text-white text-sm font-semibold hover:bg-[#e62e3d] flex items-center gap-1.5"><Plus size={16} /> <span class="hidden sm:inline">New shift</span></button>
      {/if}
    </div>
  </div>

  <!-- mobile: stacked days -->
  <div class="flex flex-col gap-4 md:hidden">
    {#each days as d}
      <section class="bg-[#0e0e12]/80 border border-white/5 rounded-2xl p-3">
        <h2 class="text-sm font-bold mb-2 {d === isoDay(0) ? 'text-[#ff5c6c]' : ''}">{fmtDateLong(d)}</h2>
        {#if shiftsFor(d).length === 0}
          <p class="text-xs text-neutral-500 py-1">No shifts.</p>
        {:else}
          <ul class="flex flex-col gap-2">
            {#each shiftsFor(d) as s}
              <li>
                <button onclick={() => openShift(s.id)} class="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#ff3344]/30">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-semibold truncate">{s.title}</span>
                    <Badge status={s.status} />
                  </div>
                  <div class="text-xs text-neutral-500 mt-1">{fmtRange(s.startMin, s.endMin)} · {s.location}</div>
                  <div class="text-xs text-neutral-400 mt-1">{s.assignments.length}/{s.officersNeeded} staffed</div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  </div>

  <!-- desktop: week grid -->
  <div class="hidden md:grid md:grid-cols-7 gap-2">
    {#each days as d}
      <section class="bg-[#0e0e12]/80 border border-white/5 rounded-2xl p-2 min-h-[280px]">
        <h2 class="text-xs font-bold mb-2 px-1 {d === isoDay(0) ? 'text-[#ff5c6c]' : ''}">{fmtDate(d)}</h2>
        <ul class="flex flex-col gap-1.5">
          {#each shiftsFor(d) as s}
            <li>
              <button onclick={() => openShift(s.id)} class="w-full text-left p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#ff3344]/30">
                <div class="text-[11px] text-neutral-400">{fmtRange(s.startMin, s.endMin)}</div>
                <div class="text-xs font-semibold truncate">{s.title}</div>
                <div class="text-[11px] text-neutral-500 truncate">{s.location}</div>
                <div class="mt-1"><Badge status={`${s.assignments.length}/${s.officersNeeded}`} tone={s.assignments.length >= s.officersNeeded ? "assigned" : "open"} /></div>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
</div>

<!-- shift detail drawer -->
<Drawer open={!!sel} title={sel ? sel.title : ""} onclose={() => (selected = null)}>
  {#if sel}
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 flex-wrap">
        <Badge status={sel.status} />
        <span class="text-xs text-neutral-400">{fmtDateLong(sel.date)} · {fmtRange(sel.startMin, sel.endMin)} · {fmtHours(shiftHours(sel))}</span>
      </div>
      <dl class="text-sm grid grid-cols-[110px_1fr] gap-y-1.5">
        <dt class="text-neutral-500">Client</dt><dd class="font-medium">{selClient?.name}</dd>
        <dt class="text-neutral-500">Location</dt><dd>{sel.location}</dd>
        <dt class="text-neutral-500">Rate</dt><dd>${sel.rate}/hr per officer</dd>
        {#if sel.notes}<dt class="text-neutral-500">Notes</dt><dd>{sel.notes}</dd>{/if}
      </dl>

      <div>
        <h3 class="text-sm font-bold mb-2">Assigned ({sel.assignments.length}/{sel.officersNeeded})</h3>
        {#if sel.assignments.length === 0}
          <p class="text-xs text-neutral-500">No officers assigned yet.</p>
        {:else}
          <ul class="flex flex-col gap-1.5">
            {#each sel.assignments as oid}
              {@const o = $officerById[oid]}
              <li class="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-8 h-8 rounded-full bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-[11px] font-bold text-[#ff5c6c] shrink-0">{initials(o?.name || "?")}</span>
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate">{o?.name}</div>
                    <div class="text-[11px] text-neutral-500">{o?.shield}</div>
                  </div>
                </div>
                {#if manage && sel.status !== "completed"}
                  <button onclick={() => unassignOfficer(sel.id, oid)} aria-label="Remove {o?.name}" class="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20"><X size={15} /></button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      {#if manage && sel.status !== "completed" && sel.status !== "cancelled"}
        <div>
          <h3 class="text-sm font-bold mb-2">Assign officer</h3>
          <div class="flex gap-2">
            <select bind:value={assignPick} class="flex-1 min-w-0 h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" aria-label="Choose officer">
              <option value="">Select officer…</option>
              {#each eligibleList as { o, check }}
                <option value={o.id} disabled={!check.ok}>{o.name} — {o.shield}{check.ok ? "" : " (ineligible)"}</option>
              {/each}
            </select>
            <button onclick={doAssign} class="h-11 px-4 rounded-xl bg-[#ff3344] text-white text-sm font-semibold hover:bg-[#e62e3d]">Assign</button>
          </div>
          {#if assignPick}
            {@const pick = eligibleList.find((e) => e.o.id === assignPick)}
            {#if pick && !pick.check.ok}
              <p class="text-xs text-amber-300 mt-2 flex gap-1.5"><TriangleAlert size={14} class="shrink-0 mt-0.5" /> {pick.check.reasons.join(" ")}</p>
            {/if}
          {/if}
          {#if assignError}<p class="text-xs text-red-300 mt-2">{assignError}</p>{/if}
          <details class="mt-2 text-xs text-neutral-500">
            <summary class="cursor-pointer hover:text-neutral-300">Why is someone ineligible?</summary>
            <ul class="mt-1.5 flex flex-col gap-1 list-disc pl-4">
              {#each eligibleList.filter((e) => !e.check.ok) as { o, check }}
                <li><span class="text-neutral-300">{o.name}:</span> {check.reasons.join("; ")}</li>
              {/each}
            </ul>
          </details>
        </div>
        <div class="flex gap-2">
          {#if sel.status !== "in-progress"}
            <button onclick={() => setShiftStatus(sel.id, "in-progress")} class="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10">Start shift</button>
          {:else}
            <button onclick={() => setShiftStatus(sel.id, "completed")} class="flex-1 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm font-semibold hover:bg-emerald-500/25">Complete shift</button>
          {/if}
          <button onclick={() => { setShiftStatus(sel.id, "cancelled"); selected = null; }} class="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-neutral-400 hover:bg-red-500/20">Cancel</button>
        </div>
      {/if}
    </div>
  {/if}
</Drawer>

<!-- new shift drawer -->
<Drawer open={creating} title="New shift" onclose={() => (creating = false)}>
  <div class="flex flex-col gap-3">
    <label class="text-sm flex flex-col gap-1.5">Client
      <select bind:value={f.clientId} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
        {#each $clients as c}<option value={c.id}>{c.name}</option>{/each}
      </select>
    </label>
    <label class="text-sm flex flex-col gap-1.5">Title
      <input bind:value={f.title} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <label class="text-sm flex flex-col gap-1.5">Location <span class="text-neutral-500 text-xs">(defaults to client name)</span>
      <input bind:value={f.location} placeholder="e.g. North entrance" class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <label class="text-sm flex flex-col gap-1.5">Date
      <input type="date" bind:value={f.date} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <div class="grid grid-cols-2 gap-3">
      <label class="text-sm flex flex-col gap-1.5">Start
        <select bind:value={f.startMin} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          {#each HOURS as h}<option value={h}>{h === 720 ? "12" : h > 720 ? h/60 - 12 : h/60}:00 {h >= 720 ? "PM" : "AM"}</option>{/each}
        </select>
      </label>
      <label class="text-sm flex flex-col gap-1.5">End
        <select bind:value={f.endMin} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          {#each HOURS as h}<option value={h}>{h === 720 ? "12" : h > 720 ? h/60 - 12 : h/60}:00 {h >= 720 ? "PM" : "AM"}</option>{/each}
        </select>
      </label>
    </div>
    <label class="text-sm flex flex-col gap-1.5">Officers needed
      <input type="number" min="1" max="20" bind:value={f.officersNeeded} class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
    </label>
    <label class="text-sm flex flex-col gap-1.5">Notes
      <textarea bind:value={f.notes} rows="2" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm"></textarea>
    </label>
    <button onclick={submitNew} class="h-12 rounded-xl bg-[#ff3344] text-white text-sm font-bold hover:bg-[#e62e3d]">Create shift</button>
  </div>
</Drawer>
