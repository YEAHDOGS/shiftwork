<script>
  import { onMount } from "svelte";
  import { role, officers, clients, canView, seedPayoutPaid } from "./lib/store.js";
  import Dashboard from "./views/Dashboard.svelte";
  import Schedule from "./views/Schedule.svelte";
  import Officers from "./views/Officers.svelte";
  import Clients from "./views/Clients.svelte";
  import Billing from "./views/Billing.svelte";
  import Payouts from "./views/Payouts.svelte";
  import Audit from "./views/Audit.svelte";
  import { LayoutDashboard, CalendarDays, Users, Building2, Receipt, Wallet, ScrollText } from "@lucide/svelte";
  import logo from "./assets/logo.svg";
  import badge from "./assets/made-by-dogs.png";

  seedPayoutPaid();

  const ROUTES = {
    dashboard: { view: Dashboard, label: "Dashboard", icon: LayoutDashboard },
    schedule: { view: Schedule, label: "Schedule", icon: CalendarDays },
    officers: { view: Officers, label: "Officers", icon: Users },
    clients: { view: Clients, label: "Clients", icon: Building2 },
    billing: { view: Billing, label: "Billing", icon: Receipt },
    payouts: { view: Payouts, label: "Payouts", icon: Wallet },
    audit: { view: Audit, label: "Audit", icon: ScrollText },
  };

  let current = $state("dashboard");
  function parseHash() {
    const h = window.location.hash.replace("#/", "").split("?")[0];
    current = ROUTES[h] ? h : "dashboard";
    if (!canView(current)) current = "dashboard";
  }
  onMount(() => {
    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  });

  const navItems = $derived(Object.entries(ROUTES).filter(([key]) => canView(key)));

  function setRoleType(t) {
    role.update((r) => ({ ...r, type: t }));
    if (!canView(current)) { window.location.hash = "#/dashboard"; current = "dashboard"; }
  }
  const r = $derived($role);
  const ROLE_LABEL = { admin: "Admin", coordinator: "Coordinator", officer: "Officer", client: "Client" };
</script>

<svelte:head>
  <title>Shiftwork — Paid Detail Management</title>
  <meta name="description" content="Shiftwork: police paid-detail scheduling, eligibility, billing, and payouts. Demo with fictional data." />
</svelte:head>

<div class="min-h-100dvh bg-[#050508] text-white flex flex-col md:flex-row">
  <!-- header (mobile top) -->
  <header class="md:hidden sticky top-0 z-30 bg-[#050508]/95 backdrop-blur border-b border-white/5">
    <div class="flex items-center justify-between px-4 h-16">
      <div class="flex items-center gap-2.5">
        <img src={logo} alt="Shiftwork" class="w-8 h-8 object-contain" />
        <div>
          <div class="font-bold tracking-tight leading-none">Shiftwork</div>
          <div class="text-[10px] text-neutral-500 mt-0.5">Paid Detail Management</div>
        </div>
      </div>
      <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">DEMO DATA</span>
    </div>
    <div class="px-4 pb-3 flex gap-2">
      <select value={r.type} onchange={(e) => setRoleType(e.currentTarget.value)} aria-label="View as role"
        class="h-10 flex-1 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
        {#each Object.entries(ROLE_LABEL) as [k, v]}<option value={k}>View as: {v}</option>{/each}
      </select>
      {#if r.type === "officer"}
        <select value={r.officerId} onchange={(e) => role.update((x) => ({ ...x, officerId: e.currentTarget.value }))} aria-label="Choose officer"
          class="h-10 flex-1 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          {#each $officers as o}<option value={o.id}>{o.name}</option>{/each}
        </select>
      {/if}
      {#if r.type === "client"}
        <select value={r.clientId} onchange={(e) => role.update((x) => ({ ...x, clientId: e.currentTarget.value }))} aria-label="Choose client"
          class="h-10 flex-1 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          {#each $clients as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
      {/if}
    </div>
  </header>

  <!-- side rail (desktop) -->
  <aside class="hidden md:flex flex-col w-60 shrink-0 border-r border-white/5 p-4 gap-1 sticky top-0 h-100dvh">
    <div class="flex items-center gap-2.5 px-2 py-3">
      <img src={logo} alt="Shiftwork" class="w-9 h-9 object-contain" />
      <div>
        <div class="font-bold tracking-tight leading-none">Shiftwork</div>
        <div class="text-[10px] text-neutral-500 mt-0.5">Paid Detail Management</div>
      </div>
    </div>
    <span class="mx-2 mb-2 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">DEMO DATA</span>
    {#each navItems as [key, item]}
      {@const Icon = item.icon}
      <a href={`#/${key}`} class={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium ${current === key ? "bg-[#ff3344]/10 text-white border border-[#ff3344]/25" : "text-neutral-400 hover:bg-white/5 border border-transparent"}`}>
        <Icon size={17} /> {item.label}
      </a>
    {/each}
    <div class="mt-auto px-2 flex flex-col gap-2">
      <label class="text-xs text-neutral-500 font-medium">View as</label>
      <select value={r.type} onchange={(e) => setRoleType(e.currentTarget.value)} aria-label="View as role"
        class="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm w-full">
        {#each Object.entries(ROLE_LABEL) as [k, v]}<option value={k}>{v}</option>{/each}
      </select>
      {#if r.type === "officer"}
        <select value={r.officerId} onchange={(e) => role.update((x) => ({ ...x, officerId: e.currentTarget.value }))} aria-label="Choose officer"
          class="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm w-full">
          {#each $officers as o}<option value={o.id}>{o.name}</option>{/each}
        </select>
      {/if}
      {#if r.type === "client"}
        <select value={r.clientId} onchange={(e) => role.update((x) => ({ ...x, clientId: e.currentTarget.value }))} aria-label="Choose client"
          class="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm w-full">
          {#each $clients as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
      {/if}
      <a href="https://wearedogs.net" target="_blank" rel="noopener noreferrer" class="mt-1 block w-fit">
        <img src={badge} alt="Made by DOGS" class="h-7 w-auto opacity-80 hover:opacity-100" />
      </a>
    </div>
  </aside>

  <!-- main -->
  <main class="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-10 max-w-7xl w-full mx-auto">
    {#key current}
      {@const V = ROUTES[current].view}
      <V />
    {/key}
    <footer class="mt-10 flex justify-center md:hidden">
      <a href="https://wearedogs.net" target="_blank" rel="noopener noreferrer">
        <img src={badge} alt="Made by DOGS" class="h-7 w-auto opacity-80" />
      </a>
    </footer>
  </main>

  <!-- bottom nav (mobile) -->
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0b0b0f]/95 backdrop-blur border-t border-white/5" aria-label="Primary">
    <div class="grid" style={`grid-template-columns: repeat(${navItems.length}, 1fr)`}>
      {#each navItems as [key, item]}
        {@const Icon = item.icon}
        <a href={`#/${key}`} class={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${current === key ? "text-[#ff5c6c]" : "text-neutral-500"}`}>
          <Icon size={20} />
          {item.label}
        </a>
      {/each}
    </div>
  </nav>
</div>

<style lang="scss">
  @use "./styles/variables" as *;
  select option { background-color: #0e0e12; color: #fff; }
</style>
