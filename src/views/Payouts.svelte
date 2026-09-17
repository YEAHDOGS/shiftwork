<script>
  import { payouts, officers, shifts, role, officerById, shiftById, togglePayoutPaid, payAllOfficer, canManage } from "../lib/store.js";
  import { fmtMoney, fmtHours, fmtDate, initials } from "../lib/format.js";
  import Badge from "../components/Badge.svelte";
  import { Wallet, CheckCheck } from "@lucide/svelte";

  const manage = canManage();
  const r = $derived($role);
  const myOfficer = $derived(r.type === "officer" ? r.officerId : null);

  // summary per officer
  const summary = $derived($officers.map((o) => {
    const rows = $payouts.filter((p) => p.officerId === o.id);
    return {
      o,
      ytd: rows.reduce((a, p) => a + p.amount, 0),
      pending: rows.filter((p) => !p.paid).reduce((a, p) => a + p.amount, 0),
      count: rows.filter((p) => !p.paid).length,
    };
  }).filter((s) => (myOfficer ? s.o.id === myOfficer : s.ytd > 0 || s.count > 0))
    .sort((a, b) => b.pending - a.pending));

  let expanded = $state(null);
  const rowsFor = (oid) => $payouts.filter((p) => p.officerId === oid);
</script>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Payouts</h1>
    <p class="text-sm text-neutral-400 mt-0.5">
      {#if myOfficer}Your detail earnings.
      {:else}Officer pay ledger · 1099 totals accumulate per officer.{/if}
    </p>
  </div>

  <ul class="flex flex-col gap-2">
    {#each summary as s}
      <li class="rounded-2xl bg-[#0e0e12]/80 border border-white/5 overflow-hidden">
        <button onclick={() => (expanded = expanded === s.o.id ? null : s.o.id)} class="w-full text-left flex items-center gap-3 p-3.5 hover:bg-white/[0.02]">
          <span class="w-11 h-11 rounded-full bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-xs font-bold text-[#ff5c6c] shrink-0">{initials(s.o.name)}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold truncate">{s.o.name} <span class="text-neutral-500 font-normal">· {s.o.shield}</span></div>
            <div class="text-xs text-neutral-500">YTD {fmtMoney(s.ytd)}</div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-bold {s.pending > 0 ? 'text-amber-300' : 'text-neutral-500'}">{fmtMoney(s.pending)}</div>
            <div class="text-[11px] text-neutral-500">{s.count} pending</div>
          </div>
        </button>
        {#if expanded === s.o.id}
          <div class="border-t border-white/5 px-3.5 py-3">
            {#if manage && s.count > 0}
              <button onclick={() => payAllOfficer(s.o.id)} class="mb-2.5 h-10 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 flex items-center gap-1.5">
                <CheckCheck size={15} /> Pay all {s.count} pending ({fmtMoney(s.pending)})
              </button>
            {/if}
            <ul class="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {#each rowsFor(s.o.id) as p}
                {@const sh = $shiftById[p.shiftId]}
                <li class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
                  <div class="min-w-0">
                    <div class="font-medium truncate">{sh?.title || p.shiftId}</div>
                    <div class="text-xs text-neutral-500">{fmtDate(p.date)} · {fmtHours(p.hours)}</div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="font-semibold">{fmtMoney(p.amount)}</span>
                    {#if manage}
                      <button onclick={() => togglePayoutPaid(p.key)} class="h-9 px-3 rounded-lg text-xs font-bold {p.paid ? 'bg-white/5 border border-white/10 text-neutral-400' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'}">
                        {p.paid ? "Paid" : "Pay"}
                      </button>
                    {:else}
                      <Badge status={p.paid ? "paid" : "unpaid"} />
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  {#if summary.length === 0}<p class="text-sm text-neutral-500">No payouts yet.</p>{/if}

  {#if !myOfficer}
    <p class="text-[11px] text-neutral-600 flex items-start gap-1.5"><Wallet size={13} class="shrink-0 mt-0.5" /> Demo ledger only. A production system would issue 1099-NEC forms from these YTD totals and hold funds in a proper payroll rail — not in a browser demo.</p>
  {/if}
</div>
