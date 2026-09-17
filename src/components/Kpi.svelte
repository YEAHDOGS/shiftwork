<!-- KPI stat card -->
<script>
  let { label, value, sub = "", icon = null } = $props();
</script>

<div class="bg-[#0e0e12]/80 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
  {#if icon}
    <div class="shrink-0 w-10 h-10 rounded-xl bg-[#ff3344]/10 border border-[#ff3344]/20 flex items-center justify-center text-[#ff3344]">
      {@render icon()}
    </div>
  {/if}
  <div class="min-w-0">
    <div class="text-xl sm:text-2xl font-bold tracking-tight break-words leading-tight">{value}</div>
    <div class="text-xs text-neutral-400 font-medium">{label}</div>
    {#if sub}<div class="text-[11px] text-neutral-500 mt-0.5">{sub}</div>{/if}
  </div>
</div>
