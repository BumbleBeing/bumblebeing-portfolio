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
		{#if project.images.length > 0}
			<img
				src={project.images[0]}
				alt=""
				loading="lazy"
				class="aspect-video w-full rounded-md object-cover shadow-soft"
			/>
		{:else}
			<PlaceholderTile title={project.title} tag={project.tags[0]} />
		{/if}
	</div>

	<h3 class="font-display text-lg font-semibold">{project.title}</h3>
	<p class="text-sm text-ink-muted">{project.blurb}</p>

	{#if project.credit}
		<!-- Collaboration is disclosed on the card, not just the detail page. -->
		<p class="text-xs text-ink-muted italic">{project.credit}</p>
	{/if}

	<!-- No mt-auto: the chips follow the Blurb rather than being pushed to the
		foot of the card, so a card beside a taller one does not strand its chips
		at the bottom with a gap above them. -->
	<div class="flex flex-wrap gap-2 pt-1">
		{#each project.tags as tag (tag)}
			<Chip {tag} label={tag} />
		{/each}
		{#each project.tools as tool (tool)}
			<Chip label={tool} />
		{/each}
	</div>
</Card>
