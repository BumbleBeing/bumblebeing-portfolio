<script lang="ts">
	import type { Snippet } from 'svelte';

	let { href, children }: { href: string; children: Snippet } = $props();
</script>

<a
	{href}
	class="pencil self-start rounded-r-md bg-chip-web py-1 pr-4 pl-6 text-sm text-chip-web-fg transition-colors hover:bg-primary hover:text-primary-ink"
>
	{@render children()}
</a>

<style>
	/* Sharpened tip on the left; the rounded right end is the eraser. */
	.pencil {
		clip-path: polygon(0 50%, 0.875rem 0, 100% 0, 100% 100%, 0.875rem 100%);
	}
</style>
