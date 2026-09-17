<script>
  import { kpis, shifts, invoices, payouts, role, officers, officerById, clientById } from "../lib/store.js";
  import { fmtMoney, fmtHours, fmtDate, fmtRange } from "../lib/format.js";
  import { shiftHours } from "../lib/rules.js";
  import { isoDay, weekKey } from "../lib/seed.js";
  import Kpi from "../components/Kpi.svelte";
  import Badge from "../components/Badge.svelte";
  import { Users, CalendarDays, Clock, Wallet, AlertTriangle, Receipt } from "@lucide/svelte";

  const r = $derived($role);
  const myOfficer = $derived(r.type === "officer" ? r.officerId : null);
  const myClient = $derived(r.type === "client" ? r.clientId : null);

  const scopeShifts = $derived($shifts.filter((s) =>
    myOfficer ? s.assignments.includes(myOfficer) :
    myClient ? s.clientId === myClient : true
  ));
  const scopePayouts = $derived($payouts.filter((p) =>
    myOfficer ? p.officerId === myOfficer : true
  ));
  const scopeInvoices = $derived($invoices.filter((i) =>
    myClient ? i.clientId === myClient : true
  ));

  const today = isoDay(0);
  const upcoming = $derived(scopeShifts
    .filter((s) => s.date >= today && s.status !== "cancelled" && s.status !== "completed")
    .sort((a, b) => (a.date + a.startMin) < (b.date + b.startMin) ? -1 : 1)
    .slice(0, 5));

  const attention = $derived($shifts
    .filter((s) => !myOfficer && !myClient && s.date >= today && s.status !== "cancelled" && s.status !== "completed" && s.assignments.length < s.officersNeeded)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 5));

  const myWeekHrs = $derived(myOfficer
    ? scopeShifts.filter((s) => weekKey(s.date) === weekKey(today) && s.status !== "cancelled")
        .reduce((a, s) => a + shiftHours(s), 0) : null);
  const myPending = $derived(myOfficer ? scopePayouts.filter((p) => !p.paid).reduce((a, p) => a + p.amount, 0) : null);
  const myYtd = $derived(myOfficer ? scopePayouts.reduce((a, p) => a + p.amount, 0) : null);
  const myUnpaid = $derived(myClient ? scopeInvoices.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0) : null);
  const myBilled = $derived(myClient ? scopeInvoices.reduce((a, i) => a + i.total, 0) : null);

  // last 14 days hours bar chart
  const chart = $derived(Array.from({ length: 14 }, (_, i) => {
    const d = isoDay(i - 13);
    const hrs = scopeShifts.filter((s) => s.date === d && s.status !== "cancelled")
      .reduce((a, s) => a + shiftHours(s) * (myOfficer ? 1 : s.assignments.length), 0);
    return { d, hrs };
  }));
  const maxHrs = $derived(Math.max(1, ...chart.map((c) => c.hrs)));
</script>

<div class="flex flex-col gap-4 sm:gap-6">
  <div>
    <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-sm text-neutral-400 mt-0.5">
      {#if r.type === "officer"}Your assignments, hours, and payouts.
      {:else if r.type === "client"}{$clientById[myClient]?.name} — requests, shifts, and billing.
      {:else}Program overview — Metro City Paid Detail Unit (demo data).{/if}
    </p>
  </div>

  {#if r.type === "officer"}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi label="Hours this week" value={fmtHours(myWeekHrs)} />
      <Kpi label="Pending payout" value={fmtMoney(myPending)} />
      <Kpi label="Earned to date" value={fmtMoney(myYtd)} />
      <Kpi label="Upcoming shifts" value={upcoming.length} />
    </div>
  {:else if r.type === "client"}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi label="Unpaid invoices" value={fmtMoney(myUnpaid)} />
      <Kpi label="Billed to date" value={fmtMoney(myBilled)} />
      <Kpi label="Upcoming shifts" value={upcoming.length} />
      <Kpi label="Open requests" value={$shifts.filter((s) => s.clientId === myClient && s.status === "open").length} />
    </div>
  {:else}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi label="Active officers" value={$kpis.active} sub={`${$officers?.length ?? ""} total on roster`} >
        {#snippet icon()}<Users size={18} />{/snippet}
      </Kpi>
      <Kpi label="Open shifts" value={$kpis.open} sub={`${$kpis.understaffed} understaffed`}>
        {#snippet icon()}<CalendarDays size={18} />{/snippet}
      </Kpi>
      <Kpi label="Hours this week" value={fmtHours($kpis.weekHrs)}>
        {#snippet icon()}<Clock size={18} />{/snippet}
      </Kpi>
      <Kpi label="Pending payouts" value={fmtMoney($kpis.pendingPayout)} sub={`${fmtMoney($kpis.unpaidInv)} invoices unpaid`}>
        {#snippet icon()}<Wallet size={18} />{/snippet}
      </Kpi>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
    <div class="bg-[#0e0e12]/80 border border-white/5 rounded-2xl p-4">
      <h2 class="text-sm font-bold mb-3">Scheduled hours — last 14 days</h2>
      <div class="flex items-end gap-1 h-28">
        {#each chart as c}
          <div class="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${c.d}: ${fmtHours(c.hrs)}`}>
            <div class="w-full rounded-t bg-[#ff3344]/70 hover:bg-[#ff3344]" style={`height: ${Math.max(3, (c.hrs / maxHrs) * 100)}%`}></div>
            <span class="text-[9px] text-neutral-500">{c.d.slice(5).replace("-", "/")}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="bg-[#0e0e12]/80 border border-white/5 rounded-2xl p-4">
      <h2 class="text-sm font-bold mb-3">Upcoming shifts</h2>
      {#if upcoming.length === 0}
        <p class="text-sm text-neutral-500">Nothing scheduled.</p>
      {:else}
        <ul class="flex flex-col gap-2">
          {#each upcoming as s}
            <li>
              <a href="#/schedule" class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#ff3344]/30">
                <div class="min-w-0">
                  <div class="text-sm font-semibold truncate">{s.title}</div>
                  <div class="text-xs text-neutral-500">{fmtDate(s.date)} · {fmtRange(s.startMin, s.endMin)} · {s.location}</div>
                </div>
                <Badge status={`${s.assignments.length}/${s.officersNeeded}`} tone={s.assignments.length >= s.officersNeeded ? "assigned" : "open"} />
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  {#if attention.length > 0}
    <div class="bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-4">
      <h2 class="text-sm font-bold mb-3 flex items-center gap-2 text-amber-200">
        <AlertTriangle size={16} /> Needs attention
      </h2>
      <ul class="flex flex-col gap-2">
        {#each attention as s}
          <li class="flex items-center justify-between gap-3 text-sm">
            <span class="truncate">{s.title} · {s.location} · {fmtDate(s.date)}</span>
            <a href="#/schedule" class="shrink-0 text-xs font-semibold text-[#ff5c6c] hover:underline">
              Staff it ({s.assignments.length}/{s.officersNeeded})
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if r.type !== "officer" && r.type !== "client"}
    <div class="bg-[#0e0e12]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Receipt size={18} class="text-[#ff3344]" />
        <div>
          <div class="text-sm font-bold">Unpaid invoices: {fmtMoney($kpis.unpaidInv)}</div>
          <div class="text-xs text-neutral-500">Client billing collects labor + 10% program admin fee.</div>
        </div>
      </div>
      <a href="#/billing" class="shrink-0 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#ff3344] text-white hover:bg-[#e62e3d]">Review</a>
    </div>
  {/if}
</div>
