<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Post } from '$lib/content';
	import Card from './Card.svelte';
	import Chip from './Chip.svelte';

	interface Props {
		post: Post;
		/** The title's heading level: 2 on the Beelog, 3 under a section heading. */
		level?: 2 | 3;
	}

	let { post, level = 2 }: Props = $props();
</script>

<Card href={resolve('/blog/[slug]', { slug: post.slug })}>
	<time datetime={post.date} class="text-sm text-ink-muted">{post.date}</time>
	<svelte:element this={`h${level}`} class="font-display text-xl font-semibold">
		{post.title}
	</svelte:element>
	<p class="text-sm text-ink-muted">{post.blurb}</p>
	{#if post.tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each post.tags as tag (tag)}
				<Chip {tag} label={tag} />
			{/each}
		</div>
	{/if}
</Card>
