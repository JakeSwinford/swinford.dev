import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
	fmt: {
		useTabs: true,
		singleQuote: true,
		trailingComma: 'none',
		printWidth: 100,
		ignorePatterns: ['.svelte-kit/**', 'build/**', 'src/lib/mark.ts']
	},
	lint: {
		plugins: ['typescript', 'unicorn', 'oxc', 'import'],
		ignorePatterns: ['.svelte-kit/**', 'build/**'],
		rules: {
			'vite-plus/prefer-vite-plus-imports': 'error'
		},
		options: { typeAware: true, typeCheck: true },
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }]
	},
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts']
	},
	plugins: lazyPlugins(async () => {
		const [{ sveltekit }, { default: adapter }] = await Promise.all([
			import('@sveltejs/kit/vite'),
			import('@sveltejs/adapter-vercel')
		]);
		// Every page is prerendered; the runtime only covers what Vercel generates around them.
		return sveltekit({ adapter: adapter({ runtime: 'nodejs24.x' }) });
	})
});
