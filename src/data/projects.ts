// Project list for the home page and /projects (one source so the two never drift).
// A plain data module, not a content collection (CLAUDE.md: no `projects` collection).
// Descriptions are Griffin's words; `draft: true` marks placeholder copy awaiting his rewrite.
import type { ImageMetadata } from 'astro';
import okgRadial from '../assets/projects/okg-radial.webp';
import singularTall from '../assets/projects/singular-tall.webp';

export interface Project {
	title: string;
	description: string;
	// featured = full-width section with an animated preview; works = named only, no link
	tier: 'featured' | 'works';
	inProgress?: boolean; // shows the hourglass; leave off for work Griffin is happy to show as it stands
	href?: string;
	cta?: string;
	sourceHref?: string;
	preview?: ImageMetadata; // screenshot shown inside the frame
	// pan = a tall page scrolls inside the frame; zoom = the image zooms in as you scroll down, out as you scroll up
	motion?: 'pan' | 'zoom';
	previewLabel?: string; // address shown in the frame's bar
	draft?: boolean;
}

export const projects: Project[] = [
	{
		title: 'Open Knowledge Graph',
		description:
			'An open-source prerequisite knowledge graph: more than 15,000 topics across 19 domains of human knowledge.',
		tier: 'featured',
		href: 'https://openknowledgegraph.com/',
		cta: 'Explore the graph',
		preview: okgRadial,
		previewLabel: 'openknowledgegraph.com',
		motion: 'zoom',
	},
	{
		title: 'Singular',
		description:
			'A player-evaluation model powerful enough to compete with the best public models, and flexible enough to answer any question a front office wants to know.',
		tier: 'featured',
		href: '/singular',
		cta: 'Read the report',
		preview: singularTall,
		previewLabel: 'griffinhilly.com/singular',
		motion: 'pan',
	},
	// NBA Ranker hidden 2026-10-13 while its Supabase database is down; restore with tier 'featured' or 'works'.
	// NBA Draft Anti-Tanking Proposal removed 2026-10-13 (Griffin: fold into Singular; the NBA chose another measure).
	{
		title: 'One Billion Years',
		description:
			"There's been little focus on the most tangible benefits of AI deployment: saving 1 billion years of human life annually.",
		tier: 'works',
		inProgress: true,
	},
	{
		title: 'Agencyism',
		description:
			'A philosophical framework built around agency — the capacity for, and tendency toward, rational autonomy.',
		tier: 'works',
		inProgress: true,
		draft: true,
	},
	{
		title: 'Bottom Billion and Beyond',
		description:
			'An atlas of development traps — interactive data visualization on the economics of extreme poverty.',
		tier: 'works',
		inProgress: true,
		draft: true,
	},
];

export const byTier = (tier: Project['tier']) => projects.filter((p) => p.tier === tier);
