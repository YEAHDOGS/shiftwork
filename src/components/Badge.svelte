<!-- Status pill -->
<script>
  let { status, tone = null } = $props();
  const TONES = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    assigned: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    open: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    restricted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    leave: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
    suspended: "bg-red-500/15 text-red-300 border-red-500/30",
    cancelled: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
    unpaid: "bg-red-500/15 text-red-300 border-red-500/30",
    "in-progress": "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };
  const cls = $derived(tone ? TONES[tone] : TONES[status] || TONES.leave);
</script>

<span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
  {status}
</span>
