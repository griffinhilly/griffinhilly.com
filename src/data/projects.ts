// Project list for the home page and /projects (one source so the two never drift).
// A plain data module, not a content collection (CLAUDE.md: no `projects` collection).
// Descriptions are Griffin's words; `draft: true` marks placeholder copy awaiting his rewrite.
import type { ImageMetadata } from 'astro';
import okgTall from '../assets/projects/okg-tall.webp';
import singularTall from '../assets/projects/singular-tall.webp';

export interface Project {
	title: string;
	description: string;
	// featured = full-width section with a scrolling preview; more = full-width row; works = named only
	tier: 'featured' | 'more' | 'works';
	inProgress?: boolean; // shows the hourglass; leave off for work Griffin is happy to show as it stands
	href?: string;
	cta?: string;
	sourceHref?: string;
	preview?: ImageMetadata; // tall full-page screenshot that scrolls inside the frame
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
		preview: okgTall,
		previewLabel: 'openknowledgegraph.com',
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
	},
	{
		title: 'NBA Ranker',
		description:
			'A crowd-consensus all-time NBA player ranking. Reorder the list, vote on head-to-head matchups, and watch every input move the global consensus.',
		tier: 'more',
		href: 'https://nba-ranker.pages.dev',
		draft: true,
	},
	{
		title: 'NBA Draft Anti-Tanking Proposal',
		description:
			"My proposed solution to the NBA's tanking issues, centered around forcing lottery teams to trade picks amongst themselves and thus align incentive to win.",
		tier: 'more',
		href: 'https://x.com/GriffinHilly/status/2024462131135934862',
		sourceHref: 'https://github.com/griffinhilly/nba-tanking-fix-simulator',
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
