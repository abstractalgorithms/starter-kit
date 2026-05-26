'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ScenarioOfDay } from '../pages/api/scenario-of-day';
import { isInterviewPrepEnabled } from '../lib/features';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Minimal post shape — matches the LeanPost used by interview-prep.tsx */
export type ScenarioPost = {
	id: string;
	title: string;
	slug: string;
	brief: string;
	readTimeInMinutes: number;
	tags: { id: string; name: string; slug: string }[];
	series: { name: string; slug: string } | null;
};

// ─── Styling maps ──────────────────────────────────────────────────────────────

const DIFFICULTY_STYLE: Record<string, { badge: string; accent: string }> = {
	Mid:    { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', accent: 'border-l-emerald-500' },
	Senior: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',         accent: 'border-l-amber-500' },
	Staff:  { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',             accent: 'border-l-rose-500' },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Match posts whose title, tags, series name, or brief contain at least one of
 * the relatedKeywords. Normalises both sides to lowercase for comparison.
 * Returns at most `limit` matches, scored by how many keywords they match.
 */
function matchPosts(posts: ScenarioPost[], keywords: string[], limit = 4): ScenarioPost[] {
	if (!keywords.length) return [];
	const normalised = keywords.map((k) => k.toLowerCase().replace(/-/g, ' '));

	const scored = posts
		.map((p) => {
			const haystack = [
				p.title,
				p.brief,
				...(p.tags ?? []).map((t) => t.name),
				p.series?.name ?? '',
			]
				.join(' ')
				.toLowerCase();

			const hits = normalised.filter((kw) => haystack.includes(kw)).length;
			return { post: p, hits };
		})
		.filter((s) => s.hits > 0)
		.sort((a, b) => b.hits - a.hits)
		.slice(0, limit)
		.map((s) => s.post);

	return scored;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<section className="py-6">
			<div className="flex items-center gap-2 mb-4">
				<div className="h-4 w-4 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				<div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
			</div>
			<div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
				<div className="h-3 w-1/4 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
				<div className="space-y-2">
					<div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
					<div className="h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
					<div className="h-4 w-4/6 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
					))}
				</div>
			</div>
		</section>
	);
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'disabled';

function OptionButton({
	letter,
	text,
	state,
	onClick,
}: {
	letter: string;
	text: string;
	state: OptionState;
	onClick: () => void;
}) {
	const base =
		'flex items-start gap-3 w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 focus:outline-none';

	const styles: Record<OptionState, string> = {
		idle:     `${base} border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer`,
		correct:  `${base} border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 cursor-default`,
		wrong:    `${base} border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 opacity-80 cursor-default`,
		disabled: `${base} border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 opacity-55 cursor-default`,
	};

	return (
		<button
			className={styles[state]}
			onClick={state === 'idle' ? onClick : undefined}
			disabled={state !== 'idle'}
		>
			<span
				className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
					state === 'correct'
						? 'bg-emerald-500 text-white'
						: state === 'wrong'
						? 'bg-rose-400 text-white'
						: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
				}`}
			>
				{state === 'correct' ? '✓' : state === 'wrong' ? '✕' : letter}
			</span>
			<span className="flex-1 leading-snug">{text}</span>
		</button>
	);
}

// ─── Main component ────────────────────────────────────────────────────────────

type Phase = 'loading' | 'question' | 'revealed' | 'error';

export function ScenarioOfDayCard({ posts }: { posts: ScenarioPost[] }) {
	const [scenario, setScenario] = useState<ScenarioOfDay | null>(null);
	const [phase, setPhase] = useState<Phase>('loading');
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/scenario-of-day')
			.then((r) => r.json())
			.then((data: ScenarioOfDay) => {
				if (cancelled) return;
				if (data && data.question) {
					setScenario(data);
					setPhase('question');
				} else {
					setPhase('error');
				}
			})
			.catch(() => {
				if (!cancelled) setPhase('error');
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Match related posts only after the answer is revealed
	const relatedPosts = useMemo(() => {
		if (phase !== 'revealed' || !scenario) return [];
		return matchPosts(posts, scenario.relatedKeywords);
	}, [phase, scenario, posts]);

	function handleOptionClick(idx: number) {
		if (phase !== 'question') return;
		setSelectedIdx(idx);
		setPhase('revealed');
	}

	if (phase === 'loading') return <SkeletonCard />;
	if (phase === 'error' || !scenario) return null; // silent fail

	const diffStyle = DIFFICULTY_STYLE[scenario.difficulty] ?? DIFFICULTY_STYLE['Senior'];
	const isCorrect = selectedIdx === scenario.answer;

	return (
		<section className="py-6">
			{/* Section header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-lg" aria-hidden="true">🎯</span>
					<span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 tracking-wide uppercase">
						Scenario of the Day
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="hidden sm:inline-block rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
						{scenario.topic}
					</span>
					<span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${diffStyle.badge}`}>
						{scenario.difficulty}-level
					</span>
				</div>
			</div>

			{/* Card */}
			<div className={`rounded-2xl border border-l-4 ${diffStyle.accent} border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden`}>

				{/* Scenario setup */}
				<div className="px-6 pt-6 pb-3">
					<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
						The Situation
					</p>
					<p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic border-l-2 border-neutral-200 dark:border-neutral-700 pl-3">
						{scenario.scenario}
					</p>
				</div>

				{/* Question */}
				<div className="px-6 pb-4 pt-1">
					<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
						The Question
					</p>
					<p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
						{scenario.question}
					</p>
				</div>

				{/* Options */}
				<div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
					{scenario.options.map((opt, idx) => {
						let state: OptionState = 'idle';
						if (phase === 'revealed') {
							if (idx === scenario.answer) state = 'correct';
							else if (idx === selectedIdx) state = 'wrong';
							else state = 'disabled';
						}
						return (
							<OptionButton
								key={idx}
								letter={OPTION_LETTERS[idx] ?? String(idx + 1)}
								text={opt}
								state={state}
								onClick={() => handleOptionClick(idx)}
							/>
						);
					})}
				</div>

				{/* Revealed: explanation + takeaway + related posts */}
				{phase === 'revealed' && (
					<div className={`border-t border-neutral-100 dark:border-neutral-800 px-6 py-5 space-y-5 ${isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-amber-50/40 dark:bg-amber-950/10'}`}>

						{/* Result line */}
						<div className="flex items-center gap-2">
							<span className="text-xl" aria-hidden="true">{isCorrect ? '🎉' : '💡'}</span>
							<span className={`text-sm font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-400'}`}>
								{isCorrect
									? 'Correct! Great engineering intuition.'
									: `Not quite — the right approach is ${OPTION_LETTERS[scenario.answer]}.`}
							</span>
						</div>

						{/* Explanation */}
						<div>
							<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Why?</p>
							<p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{scenario.explanation}</p>
						</div>

						{/* Key takeaway */}
						{scenario.takeaway && (
							<div className="flex gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-4 py-3">
								<span className="text-sm flex-shrink-0" aria-hidden="true">📌</span>
								<p className="text-xs font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
									<span className="font-bold">Key principle: </span>{scenario.takeaway}
								</p>
							</div>
						)}

						{/* Related posts */}
						{relatedPosts.length > 0 && (
							<div>
								<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
									📚 Go deeper — related posts from this blog
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{relatedPosts.map((p) => (
										<Link
											key={p.id}
											href={`/${p.slug}`}
											className="group flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
										>
											<span className="flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
													<path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
												</svg>
											</span>
											<div className="min-w-0 flex-1">
												<p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
													{p.title}
												</p>
												<p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
													{p.readTimeInMinutes} min read
												</p>
											</div>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-300 dark:text-neutral-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors"
											>
												<path
													fillRule="evenodd"
													d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
													clipRule="evenodd"
												/>
											</svg>
										</Link>
									))}
								</div>
							</div>
						)}

						{/* If no posts matched */}
						{relatedPosts.length === 0 && (
							<div className="text-center py-2">
								<Link
									href={isInterviewPrepEnabled ? '/interview-prep' : '/posts'}
									className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
								>
									Explore all {isInterviewPrepEnabled ? 'interview topics' : 'learning topics'} →
								</Link>
							</div>
						)}
					</div>
				)}

				{/* Footer */}
				<div className="px-6 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5">
					<span className="text-xs text-neutral-400 dark:text-neutral-500">
						🗓 Fresh scenario every day ·{' '}
						{new Date(scenario.date + 'T00:00:00').toLocaleDateString('en-US', {
							weekday: 'short',
							month: 'short',
							day: 'numeric',
						})}
					</span>
				</div>
			</div>
		</section>
	);
}
