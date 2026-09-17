<script>
  import { invoices, clients, shifts, role, clientById, shiftById, officerById, toggleInvoicePaid, canManage } from "../lib/store.js";
  import { fmtMoney, fmtDate, fmtRange } from "../lib/format.js";
  import { shiftHours, ADMIN_FEE } from "../lib/rules.js";
  import Badge from "../components/Badge.svelte";
  import Drawer from "../components/Drawer.svelte";
  import { Receipt } from "@lucide/svelte";

  const manage = canManage();
  const r = $derived($role);
  const myClient = $derived(r.type === "client" ? r.clientId : null);
  const visible = $derived($invoices.filter((i) => (myClient ? i.clientId === myClient : true)));

  let selected = $state(null);
  const sel = $derived($invoices.find((i) => i.id === selected) || null);
  const selShifts = $derived(sel ? sel.shiftIds.map((id) => $shiftById[id]).filter(Boolean) : []);
  const selClient = $derived(sel ? $clientById[sel.clientId] : null);

  const totalUnpaid = $derived(visible.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0));
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Billing</h1>
      <p class="text-sm text-neutral-400 mt-0.5">Labor + {Math.round(ADMIN_FEE * 100)}% program admin fee · one invoice per client per week</p>
    </div>
    {#if totalUnpaid > 0}
      <div class="text-right">
        <div class="text-lg font-bold text-amber-300">{fmtMoney(totalUnpaid)}</div>
        <div class="text-xs text-neutral-500">unpaid</div>
      </div>
    {/if}
  </div>

  <ul class="flex flex-col gap-2">
    {#each visible as inv}
      {@const c = $clientById[inv.clientId]}
      <li>
        <button onclick={() => (selected = inv.id)} class="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl bg-[#0e0e12]/80 border border-white/5 hover:border-[#ff3344]/30">
          <span class="w-11 h-11 rounded-xl bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-[#ff5c6c] shrink-0"><Receipt size={18} /></span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold">{inv.id} <span class="font-normal text-neutral-500">· {c?.name}</span></div>
            <div class="text-xs text-neutral-500">Week of {fmtDate(inv.week)} · {inv.shiftIds.length} shifts</div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-bold">{fmtMoney(inv.total)}</div>
            <Badge status={inv.paid ? "paid" : "unpaid"} />
          </div>
        </button>
      </li>
    {/each}
  </ul>
  {#if visible.length === 0}<p class="text-sm text-neutral-500">No invoices yet.</p>{/if}
</div>

<Drawer open={!!sel} title={sel ? `Invoice ${sel.id}` : ""} onclose={() => (selected = null)}>
  {#if sel}
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="text-sm"><span class="text-neutral-500">Client</span><div class="font-semibold">{selClient?.name}</div></div>
        <Badge status={sel.paid ? "paid" : "unpaid"} />
      </div>
      <div class="text-xs text-neutral-500">Billing period: {fmtDate(sel.start)} – {fmtDate(sel.end)}</div>

      <div>
        <h3 class="text-sm font-bold mb-2">Line items</h3>
        <ul class="flex flex-col gap-1.5">
          {#each selShifts as s}
            {@const hrs = shiftHours(s) * s.assignments.length}
            {@const labor = hrs * s.rate}
            <li class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium truncate">{s.title}</span>
                <span class="font-semibold shrink-0">{fmtMoney(labor)}</span>
              </div>
              <div class="text-xs text-neutral-500 mt-0.5">
                {fmtDate(s.date)} · {fmtRange(s.startMin, s.endMin)} · {s.assignments.length} officers × {shiftHours(s)}h × ${s.rate}/hr
              </div>
              <div class="text-[11px] text-neutral-600 mt-0.5">
                {s.assignments.map((id) => $officerById[id]?.name).join(", ")}
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <dl class="text-sm border-t border-white/5 pt-3 grid grid-cols-[1fr_auto] gap-y-1.5">
        <dt class="text-neutral-500">Labor subtotal</dt><dd class="font-medium">{fmtMoney(sel.labor)}</dd>
        <dt class="text-neutral-500">Program admin fee ({Math.round(ADMIN_FEE * 100)}%)</dt><dd class="font-medium">{fmtMoney(sel.fee)}</dd>
        <dt class="font-bold text-base">Total due</dt><dd class="font-bold text-base">{fmtMoney(sel.total)}</dd>
      </dl>

      {#if manage}
        <button onclick={() => toggleInvoicePaid(sel.id)} class="h-12 rounded-xl text-sm font-bold {sel.paid ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/30'}">
          {sel.paid ? "Mark unpaid" : "Mark paid"}
        </button>
      {/if}
    </div>
  {/if}
</Drawer>
