<!-- Slide-over detail panel: right drawer on desktop, bottom sheet on mobile -->
<script>
  import { X } from "@lucide/svelte";
  let { open = false, title = "", onclose = () => {}, children } = $props();
  function keydown(e) { if (e.key === "Escape") onclose(); }
</script>

<svelte:window onkeydown={keydown} />

{#if open}
  <div class="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" onclick={onclose} role="presentation"></div>
  <aside
    class="fixed z-50 bg-[#0b0b0f] border-white/10 flex flex-col
           inset-x-0 bottom-0 top-16 rounded-t-3xl border-t
           sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:w-[440px] sm:rounded-none sm:border-t-0 sm:border-l"
    role="dialog" aria-modal="true" aria-label={title}
  >
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
      <h2 class="text-base font-bold tracking-tight truncate pr-4">{title}</h2>
      <button onclick={onclose} aria-label="Close panel"
        class="w-11 h-11 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <X size={18} />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto px-5 py-4">
      {@render children()}
    </div>
  </aside>
{/if}
