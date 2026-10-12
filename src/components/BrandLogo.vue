<template>
  <span class="brand" dir="ltr" aria-label="levelxup">
    <svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff8a3d" />
          <stop offset="1" stop-color="#d9480f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#brand-g)" />
      <path d="M17 33 32 18 47 33" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M17 47 32 32 47 47" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".6" />
    </svg>
    <span class="word" aria-hidden="true">
      <span>level</span>
      <svg class="x" viewBox="0 0 24 24">
        <path d="M3.5 3.5 20.5 20.5" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M3.5 20.5 19 5" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" />
        <path d="M10 3h11v11" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="up">up</span>
    </span>
  </span>
</template>

<style scoped>
.brand { display: inline-flex; align-items: center; gap: 10px; }
.mark { width: 40px; height: 40px; flex: none; filter: drop-shadow(0 4px 10px color-mix(in srgb, var(--accent) 35%, transparent)); }
.word { display: inline-flex; align-items: baseline; font-family: 'Cairo', system-ui, sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -.035em; line-height: 1; color: var(--text); }
.x { width: .6em; height: .6em; margin: 0 .02em 0 .04em; align-self: flex-end; transform: translateY(-.17em); overflow: visible; }
.up { color: var(--accent); }
</style>
