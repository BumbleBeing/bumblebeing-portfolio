<script lang="ts">
	import { posts } from '$lib/content';
	import { PostCard, Seo } from '$lib/components';
</script>

<Seo title="Beelog" description="Notes on what Jackson is building, and why." />

<div class="flex flex-col gap-8">
	<header class="flex flex-col items-center gap-2 text-center">
		<h1 class="font-display text-3xl font-bold sm:text-4xl">Beelog</h1>
		<p class="max-w-prose text-ink-muted">Notes on what I'm building, and why.</p>
	</header>

	{#if posts.length > 0}
		<div class="flex flex-col gap-4">
			{#each posts as post (post.slug)}
				<PostCard {post} />
			{/each}
		</div>
	{:else}
		<p class="text-center text-ink-muted sm:text-left">No posts yet. Check back soon.</p>
	{/if}
</div>
