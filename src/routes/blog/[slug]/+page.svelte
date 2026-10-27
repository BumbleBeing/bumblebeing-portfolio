<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackButton, Chip, Seo } from '$lib/components';

	let { data } = $props();
	const post = $derived(data.post);
	const Body = $derived(data.body);
</script>

<Seo title={post.title} description={post.blurb} type="article" publishedAt={post.date} />

<article class="flex flex-col gap-6">
	<BackButton href={resolve('/blog')}>Back to blog</BackButton>

	<header class="flex flex-col items-center gap-3 text-center">
		<time datetime={post.date} class="text-sm text-ink-muted">{post.date}</time>
		<h1 class="font-display text-3xl font-bold sm:text-4xl">{post.title}</h1>
		{#if post.tags.length > 0}
			<div class="flex flex-wrap justify-center gap-2">
				{#each post.tags as tag (tag)}
					<Chip {tag} label={tag} />
				{/each}
			</div>
		{/if}
	</header>

	<div class="post-body prose max-w-none text-ink prose-headings:font-display">
		{#if Body}
			<Body />
		{/if}
	</div>
</article>
