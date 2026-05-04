'use client';

import { useEffect, useState } from 'react';
import type { TriviaOfDay } from '../pages/api/trivia-of-day';

// ─── Difficulty styling ────────────────────────────────────────────────────────

const DIFFICULTY_STYLE: Record<string, { badge: string; glow: string }> = {
	Easy:   { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', glow: 'border-l-emerald-500' },
	Medium: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',         glow: 'border-l-amber-500' },
	Hard:   { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',             glow: 'border-l-rose-500' },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function TriviaSkeletonCard() {
	return (
		<section className="py-0">
			<div className="flex items-center gap-2 mb-2">
				<div className="h-3 w-3 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				<div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
			</div>
			<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-2">
				<div className="space-y-1">
					<div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
					<div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				</div>
				<div className="grid grid-cols-1 gap-1 pt-1">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
					))}
				</div>
			</div>
		</section>
	);
}

// ─── Main component ────────────────────────────────────────────────────────────

type Phase = 'loading' | 'question' | 'revealed' | 'error';

export function TriviaOfDayCard() {
	const [trivia, setTrivia] = useState<TriviaOfDay | null>(null);
	const [phase, setPhase] = useState<Phase>('loading');
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
	const [showFunFact, setShowFunFact] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/trivia-of-day')
			.then((r) => r.json())
			.then((data: TriviaOfDay) => {
				if (cancelled) return;
				if (data && data.question) {
					setTrivia(data);
					setPhase('question');
				} else {
					setPhase('error');
				}
			})
			.catch(() => {
				if (!cancelled) setPhase('error');
			});
		return () => { cancelled = true; };
	}, []);

	function handleOptionClick(idx: number) {
		if (phase !== 'question') return;
		setSelectedIdx(idx);
		setPhase('revealed');
	}

	if (phase === 'loading') return <TriviaSkeletonCard />;
	if (phase === 'error' || !trivia) return null; // silent fail — don't break the page

	const diffStyle = DIFFICULTY_STYLE[trivia.difficulty] ?? DIFFICULTY_STYLE['Medium'];
	const isCorrect = selectedIdx === trivia.answer;

	return (
		<section className="py-0 w-full flex flex-col h-full">
			{/* Compact section header */}
			<div className="flex items-center justify-between mb-2 gap-2">
				<div className="flex items-center gap-1.5 min-w-0">
					<span className="text-xs" aria-hidden="true">🧠</span>
					<span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-widest uppercase whitespace-nowrap">
						Trivia
					</span>
				</div>
				<div className="flex items-center gap-1.5 flex-shrink-0">
					<span className="hidden sm:inline-block rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
						{trivia.topic}
					</span>
					<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${diffStyle.badge}`}>
						{trivia.difficulty}
					</span>
				</div>
			</div>

			{/* Compact card */}
			<div className={`flex flex-col rounded-lg border border-l-4 ${diffStyle.glow} border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex-1`}>

				{/* Question - compact */}
				<div className="px-3 pt-3 pb-2">
					<p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
						{trivia.question}
					</p>
				</div>

				{/* Options - compact grid */}
				<div className="px-3 pb-2 flex flex-col gap-1.5 flex-1">
					{trivia.options.map((opt, idx) => {
						let state: 'idle' | 'correct' | 'wrong' | 'disabled' = 'idle';
						if (phase === 'revealed') {
							if (idx === trivia.answer) state = 'correct';
							else if (idx === selectedIdx) state = 'wrong';
							else state = 'disabled';
						}
						return (
							<button
								key={idx}
								onClick={state === 'idle' ? () => handleOptionClick(idx) : undefined}
								disabled={state !== 'idle'}
								className={`flex items-start gap-1.5 w-full rounded px-2 py-1 text-left text-sm font-medium transition-all duration-200 focus:outline-none ${
									state === 'idle' ? 'border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer'
									: state === 'correct' ? 'border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 cursor-default'
									: state === 'wrong' ? 'border border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 opacity-80 cursor-default'
									: 'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 opacity-60 cursor-default'
								}`}
							>
								<span className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold
									${state === 'correct' ? 'bg-emerald-500 text-white' : state === 'wrong' ? 'bg-rose-400 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
									{state === 'correct' ? '✓' : state === 'wrong' ? '✕' : OPTION_LETTERS[idx] ?? String(idx + 1)}
								</span>
								<span className="flex-1 leading-snug">{opt}</span>
							</button>
						);
					})}
				</div>

				{/* Revealed: compact explanation */}
				{phase === 'revealed' && (
					<div className={`border-t border-neutral-100 dark:border-neutral-800 px-3 py-2 space-y-1 ${isCorrect ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-rose-50/50 dark:bg-rose-950/20'}`}>

						{/* Result line */}
						<div className="flex items-center gap-1">
							<span aria-hidden="true" className="text-sm">{isCorrect ? '🎉' : '💡'}</span>
							<span className={`text-sm font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
								{isCorrect ? 'Correct!' : `Answer: ${OPTION_LETTERS[trivia.answer]}`}
							</span>
						</div>

						{/* Explanation - single line */}
						<p className="text-xs text-neutral-700 dark:text-neutral-300 leading-snug line-clamp-2">
							{trivia.explanation}
						</p>
					</div>
				)}

				{/* Footer: date label */}
				<div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1">
					<span className="text-[9px] text-neutral-400 dark:text-neutral-500">
						🗓 {new Date(trivia.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
					</span>
				</div>
			</div>
		</section>
	);
}
