import { mdsvex } from 'mdsvex';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { frameImages } from './src/lib/content/frame-images';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			prerender: {
				// An empty collection is a legitimate state, not a broken route: until
				// the first Post exists, /blog/[slug] has no entries to crawl and the
				// default 'fail' aborts the build. entries() enumerates exactly what
				// exists in each collection, so "unseen" here means "empty", not "wrong".
				handleUnseenRoutes: 'warn'
			},
			preprocess: [mdsvex({ extensions: ['.svx'], remarkPlugins: [frameImages] })],
			extensions: ['.svelte', '.svx']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
