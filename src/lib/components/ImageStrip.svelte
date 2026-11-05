<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		images: string[];
		/** Used to build each image's alt text. */
		title: string;
		class?: string;
	}

	let { images, title, class: className }: Props = $props();
</script>

<!--
	CSS scroll-snap rather than a carousel library: no JS, better touch behaviour,
	one less dependency. Renders nothing at all when there are no images, which is
	every Project's state until real screenshots exist.
-->
{#if images.length > 0}
	<!--
		A scrollable region must be reachable by keyboard or its content is
		unreachable without a mouse (WCAG 2.1.1). role="region" + aria-label makes
		it a named landmark, which is the standard pairing; the linter's rule does
		not know about that combination.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class={cn(
			// center-safe centers a lone image but falls back to start once the strip
			// overflows, so the first image is never clipped out of scroll reach.
			'flex snap-x snap-mandatory justify-center-safe gap-4 overflow-x-auto overscroll-x-contain pb-2',
			className
		)}
		tabindex="0"
		role="region"
		aria-label="{title} screenshots"
	>
		{#each images as image, index (image)}
			<!-- The same honeycomb frame as the Card Thumbnail, capped so a tall
				image can't push the title off the first screen. -->
			<div class="thumb-frame max-w-full shrink-0 snap-center">
				<img
					src={image}
					alt="{title}, screenshot {index + 1} of {images.length}"
					loading={index === 0 ? 'eager' : 'lazy'}
					class="block h-auto max-h-80 w-auto max-w-full rounded-md shadow-soft sm:max-w-md"
				/>
			</div>
		{/each}
	</div>
{/if}
