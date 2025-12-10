import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			edge: false,
			split: false
		}),
		alias: {
			$components: './src/lib/components',
			$server: './src/lib/server',
			$stores: './src/lib/stores'
		}
	}
};

export default config;
