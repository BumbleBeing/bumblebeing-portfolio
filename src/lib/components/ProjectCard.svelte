<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Project } from '$lib/content';
	import Card from './Card.svelte';
	import Chip from './Chip.svelte';
	import PlaceholderTile from './PlaceholderTile.svelte';

	interface Props {
		project: Project;
	}

	let { project }: Props = $props();
</script>

<Card href={resolve('/projects/[slug]', { slug: project.slug })}>
	<div class="thumb-frame">
		<!-- The first image sits on the tag-tinted honeycomb in place of the
			initial, so art with a transparent background reads as part of the tile.
			A fullBleed screenshot fills the tile instead. -->
		<PlaceholderTile
			title={project.title}
			tag={project.tags[0]}
			image={project.thumbnail ?? project.images[0]}
			fullBleed={project.fullBleed}
		/>
	</div>

	<!-- The colored category chip sits across from the title so the category
		reads at the same glance as the name; tool chips stay at the foot. -->
	<div class="flex items-start justify-between gap-3">
		<h3 class="font-display text-lg font-semibold">{project.title}</h3>
		<div class="flex shrink-0 flex-wrap justify-end gap-2 pt-0.5">
			{#each project.tags as tag (tag)}
				<Chip {tag} label={tag} />
			{/each}
		</div>
	</div>
	<p class="text-sm text-ink-muted">{project.blurb}</p>

	{#if project.credit}
		<!-- Collaboration is disclosed on the card, not just the detail page. -->
		<p class="text-xs text-ink-muted italic">{project.credit}</p>
	{/if}

	<!-- When a taller neighbor stretches the card, the chips take the leftover
		space and center in it, rather than hugging the Blurb or being stranded at
		the foot. -->
	<div class="flex flex-1 flex-wrap content-center items-center justify-center gap-2 pt-1">
		{#each project.tools as tool (tool)}
			<Chip label={tool} />
		{/each}
	</div>
</Card>
