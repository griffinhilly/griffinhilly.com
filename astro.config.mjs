// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://griffinhilly.com',
	// /singular is link-only (noindex), so keep it out of the sitemap.
	integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/singular') })],
	fonts: [
		// Night Shift redesign (2026-10-12): Schibsted Grotesk for headings + interface,
		// Literata for essay reading text, JetBrains Mono for labels and dates.
		{
			provider: fontProviders.google(),
			name: 'Schibsted Grotesk',
			cssVariable: '--font-ui',
			weights: [400, 500, 600, 700],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
			display: 'swap',
		},
		{
			provider: fontProviders.google(),
			name: 'Literata',
			cssVariable: '--font-read',
			weights: [400, 600],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
			display: 'swap',
		},
		{
			provider: fontProviders.google(),
			name: 'JetBrains Mono',
			cssVariable: '--font-mono',
			weights: [400, 500],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'Consolas', 'monospace'],
			display: 'swap',
		},
	],
});
