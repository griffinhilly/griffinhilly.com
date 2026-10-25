// check-placeholders.mjs — fail if any git-tracked page file still holds draft placeholder text.
// Purpose: Griffin, 2026-10-24: "Anything like that needs to be off the website" (a live
//          "[Griffin's intro goes here]" box). Untracked drafts in public/explorations/ are ignored.
// Run:     npm run check:placeholders   (before every push to main)
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERN = /\[Griffin|goes here\]|\[TODO|\[TBD/;
const files = execSync('git ls-files src public', { encoding: 'utf8' })
	.split('\n')
	.filter((f) => /\.(html|astro|ts|md|mdx)$/.test(f));
const bad = files.filter((f) => PATTERN.test(readFileSync(f, 'utf8')));

if (bad.length) {
	console.error('Placeholder text in tracked files:\n' + bad.join('\n'));
	process.exit(1);
}
console.log(`No placeholders in ${files.length} tracked files.`);
