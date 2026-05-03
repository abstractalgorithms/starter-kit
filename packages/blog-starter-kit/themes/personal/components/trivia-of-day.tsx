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

// ─── Option button ─────────────────────────────────────────────────────────────

function OptionButton({
	letter,
	text,
	state,
	onClick,
}: {
	letter: string;
	text: string;
	state: 'idle' | 'correct' | 'wrong' | 'disabled';
	onClick: () => void;
}) {
	const base = 'flex items-start gap-2.5 w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all duration-200 focus:outline-none';

	const styles: Record<string, string> = {
		idle:     `${base} border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer`,
		correct:  `${base} border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 cursor-default`,
		wrong:    `${base} border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 opacity-80 cursor-default`,
		disabled: `${base} border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 opacity-60 cursor-default`,
	};

	return (
		<button className={styles[state]} onClick={state === 'idle' ? onClick : undefined} disabled={state !== 'idle'}>
			<span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
				${state === 'correct' ? 'bg-emerald-500 text-white' : state === 'wrong' ? 'bg-rose-400 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
				{state === 'correct' ? '✓' : state === 'wrong' ? '✕' : letter}
			</span>
			<span className="flex-1 leading-snug">{text}</span>
		</button>
	);
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function TriviaSkeletonCard() {
	return (
		<section className="py-4">
			<div className="flex items-center gap-2 mb-3">
				<div className="h-3.5 w-3.5 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				<div className="h-3.5 w-32 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
			</div>
			<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
				<div className="space-y-1.5">
					<div className="h-3.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
					<div className="h-3.5 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
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
		<section className="py-4 w-full flex flex-col h-full">
			{/* Section header */}
			<div className="flex items-center justify-between mb-3 gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<span className="text-base" aria-hidden="true">🧠</span>
					<span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-widest uppercase whitespace-nowrap">
						Trivia of the Day
					</span>
				</div>
				<div className="flex items-center gap-2 flex-shrink-0">
					<span className="hidden sm:inline-block rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
						{trivia.topic}
					</span>
					<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${diffStyle.badge}`}>
						{trivia.difficulty}
					</span>
				</div>
			</div>

			{/* Card */}
			<div className={`flex flex-col rounded-xl border border-l-4 ${diffStyle.glow} border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex-1`}>

				{/* Question */}
				<div className="px-5 pt-4 pb-3">
					<p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
						{trivia.question}
					</p>
				</div>

				{/* Options grid - single column for sidebar */}
				<div className="px-5 pb-4 flex flex-col gap-2 flex-1">
					{trivia.options.map((opt, idx) => {
						let state: 'idle' | 'correct' | 'wrong' | 'disabled' = 'idle';
						if (phase === 'revealed') {
							if (idx === trivia.answer) state = 'correct';
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

				{/* Revealed: explanation + score */}
				{phase === 'revealed' && (
					<div className={`border-t border-neutral-100 dark:border-neutral-800 px-5 py-3 space-y-2 ${isCorrect ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-rose-50/50 dark:bg-rose-950/20'}`}>

						{/* Result line */}
						<div className="flex items-center gap-2">
							<span aria-hidden="true">{isCorrect ? '🎉' : '💡'}</span>
							<span className={`text-sm font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
								{isCorrect ? 'Correct! Well done.' : `Not quite — the correct answer is ${OPTION_LETTERS[trivia.answer]}.`}
							</span>
						</div>

						{/* Explanation */}
						<p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
							{trivia.explanation}
						</p>

						{/* Fun fact toggle */}
						{trivia.funFact && (
						<div className="space-y-2">
							{!showFunFact ? (
								<button
									onClick={() => setShowFunFact(true)}
									className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
								>
									<span>✨</span> Show fun fact
								</button>
							) : (
								<>
									<div className="flex gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 px-3 py-2">
										<span className="text-sm" aria-hidden="true">✨</span>
										<p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
											{trivia.funFact}
										</p>
									</div>
									<button
										onClick={() => {
											window.dispatchEvent(
												new CustomEvent('open-chatbot', {
													detail: { question: `Tell me more about: ${trivia.funFact}` },
												})
											);
										}}
										className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none transition-colors"
									>
										<span aria-hidden="true">💬</span> Want to know more? Ask AI →
									</button>
								</>
								)}
							</div>
						)}
					</div>
				)}

				{/* Footer: date label */}
				<div className="px-5 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5">
					<span className="text-xs text-neutral-400 dark:text-neutral-500">
						🗓 New trivia every day · {new Date(trivia.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
					</span>
				</div>
			</div>
		</section>
	);
}
