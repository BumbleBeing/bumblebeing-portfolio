<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		/** Makes the whole card a link, with the hover state on the card rather than the title. */
		href?: string;
		class?: string;
		children: Snippet;
	}

	let { href, class: className, children }: Props = $props();

	// Deliberately a plain rounded rectangle. Hexagonal cards force awkward text
	// wrapping and break at every breakpoint (ADR 0002's "function over theme").
	const base = 'flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-soft';
	const interactive = 'transition-colors hover:border-primary';
</script>

{#if href}
	<!-- Generic primitive: resolution is the caller's job. See Button.svelte. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} data-card class={cn(base, interactive, 'no-underline', className)}
		>{@render children()}</a
	>
{:else}
	<div data-card class={cn(base, className)}>{@render children()}</div>
{/if}
