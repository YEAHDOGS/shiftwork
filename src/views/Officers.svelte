<script>
  import { officers, shifts, payouts, role } from "../lib/store.js";
  import { fmtMoney, fmtHours, fmtDate, fmtRange, initials } from "../lib/format.js";
  import { shiftHours } from "../lib/rules.js";
  import { isoDay, weekKey } from "../lib/seed.js";
  import Badge from "../components/Badge.svelte";
  import Drawer from "../components/Drawer.svelte";
  import { Search, ShieldCheck, TriangleAlert, Ban, Clock } from "@lucide/svelte";

  let query = $state("");
  let statusFilter = $state("all");
  let selected = $state(null);

  const weekHrs = (id) => $shifts
    .filter((s) => s.status !== "cancelled" && weekKey(s.date) === weekKey(isoDay(0)) && s.assignments.includes(id))
    .reduce((a, s) => a + shiftHours(s), 0);

  const filtered = $derived($officers.filter((o) => {
    const q = query.trim().toLowerCase();
    const hit = !q || o.name.toLowerCase().includes(q) || o.shield.toLowerCase().includes(q);
    const st = statusFilter === "all" || o.status === statusFilter;
    return hit && st;
  }));

  const sel = $derived($officers.find((o) => o.id === selected) || null);
  const selShifts = $derived(sel ? $shifts
    .filter((s) => s.assignments.includes(sel.id) && s.status !== "cancelled")
    .sort((a, b) => (a.date < b.date ? -1 : 1)) : []);
  const selYtd = $derived(sel ? $payouts.filter((p) => p.officerId === sel.id).reduce((a, p) => a + p.amount, 0) : 0);

  const STATUS_META = {
    active: { icon: ShieldCheck, text: "Eligible for assignment" },
    restricted: { icon: TriangleAlert, text: "Limited duty — not eligible" },
    suspended: { icon: Ban, text: "Suspended — not eligible" },
    leave: { icon: Clock, text: "On leave — not eligible" },
  };
</script>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Officers</h1>
    <p class="text-sm text-neutral-400 mt-0.5">{$officers.length} on the roster · eligibility enforced at assignment</p>
  </div>

  <div class="flex gap-2">
    <div class="relative flex-1">
      <Search size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
      <input bind:value={query} placeholder="Search name or shield…" aria-label="Search officers"
        class="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-600" />
    </div>
    <select bind:value={statusFilter} aria-label="Filter by status" class="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="restricted">Restricted</option>
      <option value="suspended">Suspended</option>
      <option value="leave">On leave</option>
    </select>
  </div>

  <ul class="flex flex-col gap-2">
    {#each filtered as o}
      <li>
        <button onclick={() => (selected = o.id)} class="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-[#0e0e12]/80 border border-white/5 hover:border-[#ff3344]/30">
          <span class="w-11 h-11 rounded-full bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-xs font-bold text-[#ff5c6c] shrink-0">{initials(o.name)}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold truncate">{o.name} <span class="text-neutral-500 font-normal">· {o.rank}</span></div>
            <div class="text-xs text-neutral-500">{o.shield} · {fmtHours(weekHrs(o.id))} this week</div>
          </div>
          <Badge status={o.status} />
        </button>
      </li>
    {/each}
  </ul>
  {#if filtered.length === 0}<p class="text-sm text-neutral-500">No officers match.</p>{/if}
</div>

<Drawer open={!!sel} title={sel ? sel.name : ""} onclose={() => (selected = null)}>
  {#if sel}
    {@const meta = STATUS_META[sel.status]}
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="w-14 h-14 rounded-full bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-base font-bold text-[#ff5c6c]">{initials(sel.name)}</span>
        <div>
          <div class="text-sm text-neutral-400">{sel.rank} · {sel.shield}</div>
          <div class="mt-1"><Badge status={sel.status} /></div>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
        <svelte:component this={meta.icon} size={16} class="shrink-0 mt-0.5 text-neutral-400" />
        <p class="text-xs text-neutral-400">{meta.text}. Rules: active status, paid-detail training complete, full-duty clearance, no overlapping assignment, {28}h weekly cap.</p>
      </div>

      <dl class="text-sm grid grid-cols-[130px_1fr] gap-y-1.5">
        <dt class="text-neutral-500">Phone</dt><dd>{sel.phone}</dd>
        <dt class="text-neutral-500">Email</dt><dd class="break-all">{sel.email}</dd>
        <dt class="text-neutral-500">Detail rate</dt><dd>${sel.rate}/hr</dd>
        <dt class="text-neutral-500">Training</dt><dd>{sel.trained ? "Complete" : "Incomplete"}</dd>
        <dt class="text-neutral-500">Hours this week</dt><dd>{fmtHours(weekHrs(sel.id))} / 28h cap</dd>
        <dt class="text-neutral-500">Earned to date</dt><dd class="font-semibold text-emerald-300">{fmtMoney(selYtd)}</dd>
      </dl>

      <div>
        <h3 class="text-sm font-bold mb-2">Assignments ({selShifts.length})</h3>
        {#if selShifts.length === 0}
          <p class="text-xs text-neutral-500">No assignments.</p>
        {:else}
          <ul class="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {#each selShifts.slice(0, 20) as s}
              <li class="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium truncate">{s.title}</span>
                  <Badge status={s.status} />
                </div>
                <div class="text-xs text-neutral-500 mt-0.5">{fmtDate(s.date)} · {fmtRange(s.startMin, s.endMin)} · {s.location}</div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/if}
</Drawer>
