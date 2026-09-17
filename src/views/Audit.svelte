<script>
  import { auditLog } from "../lib/store.js";
  import { fmtTs } from "../lib/format.js";
  import Badge from "../components/Badge.svelte";
  import { ScrollText } from "@lucide/svelte";

  let actionFilter = $state("all");
  const ACTIONS = ["all", "assign", "unassign", "create", "status", "invoice", "payout", "request", "seed"];

  const filtered = $derived($auditLog.filter((e) => actionFilter === "all" || e.action === actionFilter));

  const TONE = {
    assign: "assigned", unassign: "open", create: "assigned", status: "in-progress",
    invoice: "paid", payout: "paid", request: "open", seed: "leave",
  };
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Audit log</h1>
      <p class="text-sm text-neutral-400 mt-0.5">Append-only record of every action · admin only</p>
    </div>
    <select bind:value={actionFilter} aria-label="Filter by action" class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
      {#each ACTIONS as a}<option value={a}>{a === "all" ? "All actions" : a}</option>{/each}
    </select>
  </div>

  <ul class="flex flex-col gap-1.5">
    {#each filtered as e}
      <li class="flex items-start gap-3 p-3 rounded-2xl bg-[#0e0e12]/80 border border-white/5 text-sm">
        <span class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 shrink-0"><ScrollText size={15} /></span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <Badge status={e.action} tone={TONE[e.action] || "leave"} />
            <span class="text-xs text-neutral-500">{fmtTs(e.ts)}</span>
          </div>
          <div class="mt-1 text-neutral-200">{e.detail}</div>
          <div class="text-xs text-neutral-500 mt-0.5">Actor: {e.actor}</div>
        </div>
      </li>
    {/each}
  </ul>
  {#if filtered.length === 0}<p class="text-sm text-neutral-500">No events match.</p>{/if}
</div>
