<script lang="ts">
	import type { Tag } from '$lib/content';
	import { cn } from '$lib/utils';

	interface Props {
		title: string;
		/** Drives the tint, so the grid shows at a glance which Projects are ML. */
		tag?: Tag;
		/** Art layered over the honeycomb in place of the initial, ideally with a transparent background. */
		image?: string;
		class?: string;
	}

	let { title, tag, image, class: className }: Props = $props();

	const initial = $derived(title.trim().charAt(0).toUpperCase() || '?');

	// Tinting by Tag is what separates BoosterTutor from Bone Fracture Detector:
	// both are "B", and hue carries the information a letter cannot.
	const tints: Record<Tag, string> = {
		misc: 'text-chip-misc-fg [--tile-ink:var(--chip-misc-fg)] [--tile-ground:var(--chip-misc)]',
		game: 'text-chip-game-fg [--tile-ink:var(--chip-game-fg)] [--tile-ground:var(--chip-game)]',
		ml: 'text-chip-ml-fg [--tile-ink:var(--chip-ml-fg)] [--tile-ground:var(--chip-ml)]',
		systems:
			'text-chip-systems-fg [--tile-ink:var(--chip-systems-fg)] [--tile-ground:var(--chip-systems)]',
		web: 'text-chip-web-fg [--tile-ink:var(--chip-web-fg)] [--tile-ground:var(--chip-web)]'
	};

	const tint = $derived(
		tag ? tints[tag] : 'text-ink-muted [--tile-ink:var(--ink-muted)] [--tile-ground:var(--surface)]'
	);
</script>

<!--
	A deliberate stand-in, not a broken image: a honeycomb tile carrying the
	project's initial. Decorative, so it is hidden from assistive tech — the
	Card's own title is the accessible name.
-->
<div
	aria-hidden="true"
	class={cn(
		'flex aspect-video w-full items-center justify-center rounded-md honeycomb shadow-soft',
		'[--c1:var(--tile-ground)] [--c2:color-mix(in_oklab,var(--tile-ink)_12%,var(--tile-ground))] [--s:22px]',
		tint,
		className
	)}
>
	{#if image}
		<img src={image} alt="" loading="lazy" class="h-[88%] w-auto object-contain drop-shadow-soft" />
	{:else}
		<span class="font-display text-5xl font-bold opacity-70">{initial}</span>
	{/if}
</div>
