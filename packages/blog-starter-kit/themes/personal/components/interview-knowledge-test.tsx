import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { QuizQuestion } from '../pages/api/quiz';

// ─── Minimal types (structurally compatible with interview-prep page types) ────

type PhaseColor = 'emerald' | 'blue' | 'purple' | 'rose';

type TestPost = {
	id: string;
	title: string;
	slug: string;
	complexity?: string;
};

type TestPhase = {
	number: number;
	label: string;
	emoji: string;
	color: PhaseColor;
	posts: TestPost[];
	totalMinutes: number;
};

type TestPath = {
	phases: TestPhase[];
};

// Source posts with full metadata (tags) needed for richer quiz generation
type SourcePost = {
	id: string;
	title: string;
	slug: string;
	tags: Array<{ id: string; name: string; slug: string }>;
};

type QuizState = 'intro' | 'loading' | 'active' | 'results' | 'error';

// ─── Phase color map ──────────────────────────────────────────────────────────

const PHASE_CHIP_COLORS: Record<PhaseColor, string> = {
	emerald:
		'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30',
	blue:
		'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30',
	purple:
		'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30',
	rose:
		'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30',
};

// ─── Phase recommendation logic ───────────────────────────────────────────────

function getPhaseRecommendations(
	pct: number,
	phases: TestPhase[],
): { recommended: TestPhase[]; headline: string; subtext: string } {
	if (phases.length === 0) {
		return { recommended: [], headline: '', subtext: '' };
	}

	// With a short quiz (typically 5 questions), use broad bands
	if (pct >= 80) {
		const advanced = phases.length > 2 ? phases.slice(-1) : phases;
		return {
			recommended: advanced,
			headline: 'Strong performance! 🎉',
			subtext:
				"You're well-prepared for the fundamentals. Skim the advanced material to stay sharp before your interview.",
		};
	}

	if (pct >= 60) {
		const laterPhases =
			phases.length >= 3 ? phases.slice(Math.ceil(phases.length / 2)) : phases;
		return {
			recommended: laterPhases,
			headline: 'Solid foundation! 📘',
			subtext:
				"You've got the basics down. Focus on the deeper topics in this path to sharpen your edge.",
		};
	}

	if (pct >= 40) {
		return {
			recommended: phases,
			headline: 'Keep going! 💪',
			subtext:
				'A few gaps to fill. Work through this track from your starting point — the articles will build your intuition.',
		};
	}

	return {
		recommended: phases,
		headline: 'Start from the foundations 🌱',
		subtext:
			"The fundamentals will make everything click. Work through this path in order — you'll see rapid progress.",
	};
}

// ─── Quiz skeleton loader ─────────────────────────────────────────────────────

function QuizSkeleton({ interviewLabel }: { interviewLabel: string }) {
	return (
		<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse">
			{/* Header bar */}
			<div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
				<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-40" />
				<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
			</div>
			{/* Question blocks */}
			<div className="px-5 py-6 flex flex-col gap-7">
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} className="flex flex-col gap-3">
						<div className="flex gap-2 items-start">
							<div className="h-3.5 w-8 bg-neutral-200 dark:bg-neutral-700 rounded flex-shrink-0 mt-0.5" />
							<div className="flex-1 space-y-1.5">
								<div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
								<div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
							</div>
						</div>
						{[0, 1, 2, 3].map((j) => (
							<div
								key={j}
								className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
							>
								<div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
								<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded" style={{ width: `${55 + (j * 17) % 35}%` }} />
							</div>
						))}
					</div>
				))}
			</div>
			{/* Footer hint */}
			<div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
				<div className="h-3 w-3 rounded-full bg-violet-200 dark:bg-violet-800" />
				<div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded w-48" />
			</div>
		</div>
	);
}

// ─── Individual question block ────────────────────────────────────────────────

const LABELS = ['A', 'B', 'C', 'D'];

function QuestionBlock({
	question,
	index,
	locked,
	onAnswer,
}: {
	question: QuizQuestion;
	index: number;
	locked: boolean;
	onAnswer: (correct: boolean) => void;
}) {
	const [selected, setSelected] = useState<number | null>(null);

	const pick = (i: number) => {
		if (selected !== null || locked) return;
		setSelected(i);
		onAnswer(i === question.answer);
	};

	const getStyle = (i: number) => {
		const base =
			'w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-200';
		if (selected === null) {
			return `${base} border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-neutral-700 dark:text-neutral-300 cursor-pointer`;
		}
		if (i === question.answer) {
			return `${base} border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 cursor-default`;
		}
		if (i === selected) {
			return `${base} border-red-300 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 opacity-70 cursor-default`;
		}
		return `${base} border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 opacity-50 cursor-default`;
	};

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug">
				<span className="font-mono text-neutral-400 dark:text-neutral-500 mr-1.5">Q{index + 1}.</span>
				{question.q}
			</p>
			<div className="flex flex-col gap-2">
				{question.options.map((opt, i) => (
					<button
						key={i}
						className={getStyle(i)}
						onClick={() => pick(i)}
						disabled={selected !== null}
					>
						<span className="flex-shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold leading-none">
							{LABELS[i]}
						</span>
						<span className="flex-1">{opt}</span>
						{selected !== null && i === question.answer && (
							<svg className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
							</svg>
						)}
						{selected !== null && i === selected && i !== question.answer && (
							<svg className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
							</svg>
						)}
					</button>
				))}
			</div>
			{selected !== null && question.explanation && (
				<div className="px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
					<span className="font-bold text-neutral-700 dark:text-neutral-300">Explanation: </span>
					{question.explanation}
				</div>
			)}
		</div>
	);
}

// ─── Results panel with score + phase recommendations ─────────────────────────

function ResultsPanel({
	score,
	total,
	path,
	onRetry,
	onDismiss,
}: {
	score: number;
	total: number;
	path: TestPath;
	onRetry: () => void;
	onDismiss: () => void;
}) {
	const pct = total > 0 ? Math.round((score / total) * 100) : 0;
	const { recommended, headline, subtext } = getPhaseRecommendations(pct, path.phases);

	const radius = 40;
	const circumference = 2 * Math.PI * radius;
	const dash = (pct / 100) * circumference;

	const ringColor =
		pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-blue-500' : 'text-amber-500';
	const bgGradient =
		pct >= 80
			? 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800'
			: pct >= 60
			? 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800'
			: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800';

	return (
		<div className="flex flex-col gap-6">
			{/* Score ring */}
			<div className={`rounded-2xl border bg-gradient-to-br ${bgGradient} p-6 flex flex-col sm:flex-row items-center gap-6`}>
				<div className="relative w-24 h-24 flex-shrink-0">
					<svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
						<circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" className="stroke-neutral-200 dark:stroke-neutral-700" />
						<circle
							cx="50"
							cy="50"
							r={radius}
							fill="none"
							strokeWidth="10"
							strokeLinecap="round"
							strokeDasharray={`${dash} ${circumference}`}
							className={`${ringColor} transition-all duration-1000`}
							stroke="currentColor"
						/>
					</svg>
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<span className={`text-xl font-extrabold ${ringColor}`}>{pct}%</span>
						<span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
							{score}/{total}
						</span>
					</div>
				</div>

				<div className="text-center sm:text-left">
					<h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-1">{headline}</h4>
					<p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">{subtext}</p>
				</div>
			</div>

			{/* Phase recommendations */}
			{recommended.length > 0 && (
				<div>
					<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
						Recommended focus areas
					</p>
					<div className="flex flex-col gap-2">
						{recommended.map((phase) => {
							const firstSlug = phase.posts[0]?.slug;
							const chip = (
								<div
									key={phase.number}
									className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${PHASE_CHIP_COLORS[phase.color]}`}
								>
									<div className="flex items-center gap-2.5">
										<span className="text-lg">{phase.emoji}</span>
										<div>
											<p className="text-sm font-bold leading-snug">
												Phase {phase.number}: {phase.label}
											</p>
											<p className="text-xs opacity-70">~{phase.totalMinutes} min</p>
										</div>
									</div>
									{firstSlug && (
										<span className="text-xs font-semibold opacity-80 flex items-center gap-1 flex-shrink-0">
											Start
											<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</span>
									)}
								</div>
							);

							return firstSlug ? (
								<Link key={phase.number} href={`/${firstSlug}`}>
									{chip}
								</Link>
							) : (
								<div key={phase.number}>{chip}</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-3">
				<button
					onClick={onRetry}
					className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Retake
				</button>
				<button
					onClick={onDismiss}
					className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold transition-colors"
				>
					Done
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</button>
			</div>
		</div>
	);
}

// ─── Main exported component ──────────────────────────────────────────────────

type Props = {
	path: TestPath;
	/** All blog posts (with tags) for richer quiz generation */
	sourcePosts: SourcePost[];
	query: string;
	interviewLabel: string;
	onDismiss: () => void;
};

export function InterviewKnowledgeTest({ path, sourcePosts, query, interviewLabel, onDismiss }: Props) {
	const [state, setState] = useState<QuizState>('intro');
	const [questions, setQuestions] = useState<QuizQuestion[]>([]);
	const [answers, setAnswers] = useState<(boolean | undefined)[]>([]);
	const [errorMsg, setErrorMsg] = useState('');

	// Derive quiz posts: path posts enriched with tag metadata from sourcePosts
	const pathSlugs = new Set(path.phases.flatMap((ph) => ph.posts.map((p) => p.slug)));
	const pathPostBySlug = new Map(path.phases.flatMap((ph) => ph.posts.map((p) => [p.slug, p])));
	const quizPosts = sourcePosts
		.filter((p) => pathSlugs.has(p.slug))
		.map((p) => ({
			title: p.title,
			tags: p.tags,
			complexity: pathPostBySlug.get(p.slug)?.complexity as string | undefined,
		}));

	const generateQuiz = useCallback(async () => {
		setState('loading');
		setErrorMsg('');
		setAnswers([]);
		setQuestions([]);

		try {
			const res = await fetch('/api/quiz', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, posts: quizPosts }),
			});

			const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
			if (!res.ok || !data.questions?.length) {
				throw new Error(data.error ?? 'Failed to generate questions');
			}

			setQuestions(data.questions);
			setAnswers(new Array(data.questions.length).fill(undefined));
			setState('active');
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
			setState('error');
		}
	}, [query, quizPosts]);

	const handleAnswer = useCallback(
		(idx: number, correct: boolean) => {
			setAnswers((prev) => {
				const next = [...prev];
				next[idx] = correct;
				return next;
			});
		},
		[],
	);

	const answeredCount = answers.filter((a) => a !== undefined).length;
	const allAnswered = questions.length > 0 && answeredCount === questions.length;
	const score = answers.filter(Boolean).length;

	// ── intro ──
	if (state === 'intro') {
		return (
			<div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-6">
				<div className="flex items-start gap-4">
					<div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xl">
						🧠
					</div>
					<div className="flex-1">
						<h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-1">
							Test Your Knowledge
						</h3>
						<p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-lg">
							Answer a short quiz on <span className="font-semibold text-neutral-800 dark:text-neutral-200">{interviewLabel}</span> to find out which topics from this track deserve your attention.
						</p>
						<button
							onClick={generateQuiz}
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-950/40"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Start the Quiz
						</button>
					</div>
					<button
						onClick={onDismiss}
						className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
						aria-label="Dismiss"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		);
	}

	// ── loading ──
	if (state === 'loading') {
		return <QuizSkeleton interviewLabel={interviewLabel} />;
	}

	// ── error ──
	if (state === 'error') {
		return (
			<div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 flex flex-col items-center gap-3 text-center">
				<p className="text-sm text-red-600 dark:text-red-400 font-medium">
					{errorMsg || 'Could not generate the quiz. Please try again.'}
				</p>
				<div className="flex gap-3">
					<button
						onClick={generateQuiz}
						className="text-sm font-semibold text-red-600 dark:text-red-400 underline"
					>
						Retry
					</button>
					<button
						onClick={onDismiss}
						className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 underline"
					>
						Dismiss
					</button>
				</div>
			</div>
		);
	}

	// ── active ──
	if (state === 'active') {
		const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

		return (
			<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
				{/* Quiz header */}
				<div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600">
					<div className="flex items-center gap-2.5">
						<span className="text-lg">🧠</span>
						<div>
							<h3 className="text-white font-bold text-sm leading-snug">Test Your Knowledge</h3>
							<p className="text-white/70 text-xs">{interviewLabel}</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-20 h-1.5 rounded-full bg-white/20 overflow-hidden">
							<div
								className="h-full rounded-full bg-white transition-all duration-500"
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<span className="text-white/70 text-xs font-mono">
							{answeredCount}/{questions.length}
						</span>
					</div>
				</div>

				{/* Questions */}
				<div className="px-5 py-5 flex flex-col gap-8 bg-white dark:bg-neutral-950">
					{questions.map((q, i) => (
						<QuestionBlock
							key={i}
							question={q}
							index={i}
							locked={false}
							onAnswer={(correct) => handleAnswer(i, correct)}
						/>
					))}
				</div>

				{/* Footer — shows "See Results" when all answered */}
				<div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between gap-4">
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						{allAnswered
							? 'All questions answered — see how you did!'
							: 'Click any option to answer each question.'}
					</p>
					{allAnswered && (
						<button
							onClick={() => setState('results')}
							className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
						>
							See Results
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>
					)}
				</div>
			</div>
		);
	}

	// ── results ──
	return (
		<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
			{/* Results header */}
			<div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600">
				<span className="text-lg">🧠</span>
				<div>
					<h3 className="text-white font-bold text-sm leading-snug">Knowledge Check Results</h3>
					<p className="text-white/70 text-xs">{interviewLabel}</p>
				</div>
			</div>

			<div className="px-5 py-5 bg-white dark:bg-neutral-950">
				<ResultsPanel
					score={score}
					total={questions.length}
					path={path}
					onRetry={generateQuiz}
					onDismiss={onDismiss}
				/>
			</div>
		</div>
	);
}
