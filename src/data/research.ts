// Research entries for the home page section and /research (one source so the two never drift).
// Prose is Griffin's words. `draft: true` marks text awaiting his rewrite or OK.
// `log` lines are dated progress facts; keep them short and checkable.

export interface ResearchEntry {
	id: string; // anchor on /research
	title: string;
	status: string; // e.g. 'In progress · since Oct 2026'
	summary: string; // one line for the home page
	body: string[]; // paragraphs on /research
	log?: { date: string; text: string }[];
	links?: { label: string; href: string }[];
	href?: string; // when set, the home row and the /research title link here instead of the anchor
	draft?: boolean;
}

export const research: ResearchEntry[] = [
	{
		id: 'ai-safety-compendium',
		title: 'AI safety compendium',
		status: 'Survey · Oct 2026',
		// Griffin's coverage line from the compendium intro (2026-10-25); keep counts in step with the page.
		summary:
			'Thus far, my attempted mapping has covered 218 sources, producing 129 unique ideas across 11 category groups.',
		body: [
			'Thus far, my attempted mapping has covered 218 sources, producing 129 unique ideas across 11 category groups.',
		],
		href: '/explorations/ai-safety/',
		links: [{ label: 'Open the compendium →', href: '/explorations/ai-safety/' }],
	},
	{
		id: 'voluntary-disempowerment',
		title: 'Voluntary disempowerment: salient vs. mundane cases',
		status: 'Pilot complete · Oct 2026',
		summary:
			'How far will models push us to be our best selves? Split by salience and stakes.',
		body: [
			'Autonomy strikes me as being among the least gameable targets for alignment. However, there is a tension in resisting voluntary disempowerment if that requires the models override users’ autonomy. Where salient examples offer clear lines against approving of gradual disempowerment, I believe there are external pressures that erode those lines in mundane cases.',
			'Do AI models resist user pressure to comply with deleterious, disempowering behavior, and does that resistance vary with the salience and stakes of the situation? I ran a pilot comparing 8 models across 10 paired scenarios, each pairing a salient and a mundane version of the same request, at high and low stakes (lasting versus one-time consequences). I found models somewhat more likely to resist in salient cases, but the effect was limited and concentrated in a few of the scenarios. I plan to test this further.',
		],
		log: [
			{ date: '2026-10-17', text: 'Design drafted: 10 scenario skeletons, each in 4 versions (salient or mundane, high or low stakes). Multi-turn test harness built.' },
			{ date: '2026-10-18', text: 'Design review (three critics, a defender and a referee); 7 fixes made before the pilot. Pre-registration frozen before any model was called.' },
			{ date: '2026-10-18', text: 'Pilot run: 960 conversations across 8 models, scored by two AI judges.' },
			{ date: '2026-10-21', text: 'Human check: a blind random 10% (96 conversations) hand-coded. The main AI judge matched the human labels 90% of the time, the second judge 76%. Coding the 99 cases where the judges disagreed is next.' },
		],
		draft: true,
	},
	{
		id: 'agency-taxonomy',
		title: 'A taxonomy of human agency and autonomy',
		status: 'In progress',
		summary: 'Putting human empowerment on a scale that can guide training.',
		body: [
			'Deployed models could be restricted to actions they think will increase the autonomy of the user and of third parties not represented in the chat. To that end, it would be valuable to exhaustively map out a taxonomy of human agency and autonomy, one which would put human empowerment on a scale that can guide training. Modeled in part after Martha Nussbaum’s capabilities approach, the scope of a taxonomy of agency lends itself particularly well to the work of alignment, as ambitious a project as it may be.',
		],
		draft: true,
	},
	{
		id: 'character-constraints-consequences',
		title: 'Character, constraints, consequences',
		status: 'Framework',
		summary: 'Alignment by Onion: virtues in the model, rules in the harness, consequences in deployment.',
		body: [
			'On top of training virtues and deontological reasoning, I believe pointing models at rational autonomy as a consequentialist target can prove robust to other alignment errors. I am aware of other similar approaches in the space, including Richard Ngo’s “Aligning to Virtues”, and I plan to use this work to inform my own.',
		],
		links: [{ label: 'Richard Ngo, “Aligning to Virtues”', href: 'https://www.lesswrong.com/posts/5CZoEw7sjxnMrhgvx/aligning-to-virtues' }],
		draft: true,
	},
	{
		id: 'bottom-billion',
		title: 'Bottom Billion and Beyond',
		status: 'Replication complete · write-up in progress',
		summary: 'Paul Collier’s 2007 book argued the poorest countries were stuck in development traps. Was it true, and is it still today?',
		body: ['Paul Collier’s 2007 book argued the poorest countries were stuck in development traps. Was it true, and is it still today?'],
		draft: true,
	},
];
