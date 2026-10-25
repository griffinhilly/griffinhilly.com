// Project list for the home page and /projects (one source so the two never drift).
// A plain data module, not a content collection (CLAUDE.md: no `projects` collection).
// Descriptions are Griffin's words; `draft: true` marks placeholder copy awaiting his rewrite.
import type { ImageMetadata } from 'astro';
import okgRadial from '../assets/projects/okg-radial.webp';
import singularTall from '../assets/projects/singular-tall.webp';
import imaxThumb from '../assets/explorations/imax.webp';
import babyNamesThumb from '../assets/explorations/baby-names.webp';
import mlbThumb from '../assets/explorations/mlb-playoffs.webp';
import workflowThumb from '../assets/explorations/agent-workflow.webp';
// import polymarketThumb from '../assets/explorations/polymarket.webp'; // Polymarket held back 2026-10-18 (Griffin unsure); page + thumb stay untracked

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
	// Singular moved to Explorations 2026-10-18 (Griffin: off the home page, still on /projects).
	// NBA Ranker hidden 2026-10-13 while its Supabase database is down; restore with tier 'featured' or 'works'.
	// NBA Draft Anti-Tanking Proposal removed 2026-10-13 (Griffin: fold into Singular; the NBA chose another measure).
	{
		title: 'Agencyism',
		description:
			'A philosophical framework built around agency — the capacity for, and tendency toward, rational autonomous will.',
		tier: 'works',
		inProgress: true,
	},
	{
		title: 'One Billion Years',
		description:
			"There's been little focus on the most tangible benefits of AI deployment: saving one billion years of human life annually.",
		tier: 'works',
		inProgress: true,
	},
	// Bottom Billion and Beyond moved to the Research section (src/data/research.ts) 2026-10-18.
];

export const byTier = (tier: Project['tier']) => projects.filter((p) => p.tier === tier);

// Explorations: smaller finished pieces hosted under public/explorations/<slug>/ as-is.

export interface Exploration {
	title: string;
	description: string;
	href: string;
	thumb: ImageMetadata;
	date: string; // YYYY-MM
	draft?: boolean;
	home?: boolean; // also listed on the home page (Griffin 2026-10-18: Agent workflow only)
}

// AI buildout explainer (One Buildout, Four Futures) held back 2026-10-15 for a general-audience edit (Griffin).
export const explorations: Exploration[] = [
	{
		title: 'Agent workflow',
		description:
			'Running dozens of Claude Code sessions from a phone: an always-on desktop, a written brief for each task, and a pipeline that files saved posts.',
		href: '/explorations/agent-workflow/',
		thumb: workflowThumb,
		date: '2026-10',
		home: true,
	},
	// Polymarket edge test held back 2026-10-18 (Griffin: "I just don't know how to feel about Polymarket yet").
	// {
	// 	title: 'Polymarket edge test',
	// 	description:
	// 		'How often Polymarket prices came true, how much of the miss survives trading costs (about 1.6¢ per market), and whether posting orders beats taking them.',
	// 	href: '/explorations/polymarket/',
	// 	thumb: polymarketThumb,
	// 	date: '2026-10',
	// 	draft: true,
	// 	home: true,
	// },
	{
		title: 'Singular',
		description:
			'A player-evaluation model powerful enough to compete with the best public models, and flexible enough to answer any question a front office wants to know.',
		href: '/singular',
		thumb: singularTall,
		date: '2026-10',
	},
	{
		title: '2026 playoff odds',
		description:
			'A plate-appearance simulator plays out the rest of the 2026 postseason 20,000 times, with projected lineups and rotations. Updated daily through the World Series.',
		href: '/explorations/mlb-playoffs-2026/',
		thumb: mlbThumb,
		date: '2026-10',
	},
	{
		title: 'An Odyssey for The Odyssey',
		description:
			'The nearest 70mm IMAX theatre by driving time, for every part of the continental US.',
		href: '/explorations/imax-70mm/',
		thumb: imaxThumb,
		date: '2026-07',
	},
	{
		title: 'Baby Name Taste Map',
		description:
			'Type a name you like and get an endless stream of names with the same feel, plus a map of thousands of names clustered by style.',
		href: 'https://griffinhilly.github.io/baby-names/',
		thumb: babyNamesThumb,
		date: '2026-06',
	},
];
