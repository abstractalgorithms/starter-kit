'use client';
import { useState, useCallback } from 'react';
import type { LearningPath, LearnPost } from '../pages/api/learning-path';
import type { QuizQuestion } from '../pages/api/quiz';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizState = 'idle' | 'loading' | 'active' | 'done';

// ─── Confetti burst (pure CSS + inline SVG, no library needed) ────────────────

const CONFETTI_COLORS = [
	'#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
];

function ConfettiPiece({ i }: { i: number }) {
	const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
	const left = `${(i * 137.5) % 100}%`;
	const delay = `${(i * 0.11) % 1}s`;
	const duration = `${0.8 + (i % 5) * 0.15}s`;
	const size = i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5;
	const rotate = i % 2 === 0 ? 'rotate(45deg)' : 'rotate(0)';

	return (
		<div
			aria-hidden="true"
			style={{
				position: 'absolute',
				left,
				top: '-10px',
				width: size,
				height: size,
				borderRadius: i % 2 === 0 ? '50%' : '2px',
				backgroundColor: color,
				transform: rotate,
				animation: `confettiFall ${duration} ${delay} ease-in forwards`,
			}}
		/>
	);
}

// ─── Individual question block ────────────────────────────────────────────────

const LABELS = ['A', 'B', 'C', 'D'];

type AnswerState = number | null; // null = not answered yet

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
	const [selected, setSelected] = useState<AnswerState>(null);

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

// ─── Score celebration panel ──────────────────────────────────────────────────

function ScorePanel({
	score,
	total,
	topic,
	onRetry,
	onDismiss,
}: {
	score: number;
	total: number;
	topic: string;
	onRetry: () => void;
	onDismiss: () => void;
}) {
	const pct = Math.round((score / total) * 100);
	const passed = pct >= 60;

	const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 60 ? '✅' : pct >= 40 ? '📚' : '💪';
	const title = pct === 100
		? 'Perfect score!'
		: pct >= 80
		? 'Excellent work!'
		: pct >= 60
		? 'Good job!'
		: pct >= 40
		? 'Keep learning!'
		: 'Not quite yet — keep going!';
	const subtitle = passed
		? `You answered ${score} of ${total} questions correctly. You've got a solid grasp of ${topic}!`
		: `You answered ${score} of ${total} questions correctly. Review the articles and try again — you'll nail it!`;

	const ringColor = pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-blue-500' : 'text-amber-500';
	const bgColor = pct >= 80
		? 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800'
		: pct >= 60
		? 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800'
		: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800';

	// SVG donut ring
	const radius = 40;
	const circumference = 2 * Math.PI * radius;
	const dash = (pct / 100) * circumference;

	return (
		<>
			{/* Confetti for pass */}
			{passed && (
				<div className="relative overflow-hidden pointer-events-none" style={{ height: 0 }}>
					<style>{`
						@keyframes confettiFall {
							0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
							100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
						}
					`}</style>
					<div style={{ position: 'relative', height: 0 }}>
						{Array.from({ length: 28 }).map((_, i) => (
							<ConfettiPiece key={i} i={i} />
						))}
					</div>
				</div>
			)}

			<div className={`mt-6 rounded-2xl border bg-gradient-to-br ${bgColor} p-6 flex flex-col items-center gap-4 text-center`}>
				{/* Score ring */}
				<div className="relative w-28 h-28">
					<svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
						<circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" className="stroke-neutral-200 dark:stroke-neutral-700" />
						<circle
							cx="50" cy="50" r={radius}
							fill="none"
							strokeWidth="10"
							strokeLinecap="round"
							strokeDasharray={`${dash} ${circumference}`}
							className={`${ringColor} transition-all duration-1000`}
							stroke="currentColor"
						/>
					</svg>
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<span className={`text-2xl font-extrabold ${ringColor}`}>{pct}%</span>
						<span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">score</span>
					</div>
				</div>

				<div className="text-4xl" aria-hidden="true">{emoji}</div>
				<div>
					<h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">{title}</h4>
					<p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm">{subtitle}</p>
				</div>

				<div className="flex gap-3 mt-1">
					<button
						onClick={onRetry}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Retake Quiz
					</button>
					<button
						onClick={onDismiss}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
					>
						Done
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</button>
				</div>
			</div>
		</>
	);
}

// ─── Main exported component ──────────────────────────────────────────────────

type Props = {
	learningPath: LearningPath;
};

export function PathCompletionQuiz({ learningPath }: Props) {
	const [state, setState] = useState<QuizState>('idle');
	const [questions, setQuestions] = useState<QuizQuestion[]>([]);
	const [answers, setAnswers] = useState<boolean[]>([]);
	const [error, setError] = useState('');

	const allPosts: LearnPost[] = learningPath.phases.flatMap((p) => p.posts);
	const topic = learningPath.query;

	const generateQuiz = useCallback(async () => {
		setState('loading');
		setError('');
		setAnswers([]);
		setQuestions([]);

		try {
			const res = await fetch('/api/quiz', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: topic,
					posts: allPosts.map((p) => ({
						title: p.title,
						tags: p.tags ?? [],
						complexity: p.complexity,
					})),
				}),
			});

			const data = await res.json() as { questions?: QuizQuestion[]; error?: string };
			if (!res.ok || !data.questions?.length) {
				throw new Error(data.error ?? 'Failed to load quiz');
			}

			setQuestions(data.questions);
			setState('active');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong');
			setState('idle');
		}
	}, [topic, allPosts]);

	const handleAnswer = useCallback((idx: number, correct: boolean) => {
		setAnswers((prev) => {
			const next = [...prev];
			next[idx] = correct;
			// Auto-advance to done state when all questions answered
			if (next.filter((a) => a !== undefined).length === questions.length) {
				setTimeout(() => setState('done'), 600);
			}
			return next;
		});
	}, [questions.length]);

	const score = answers.filter(Boolean).length;

	// ── idle ──
	if (state === 'idle') {
		return (
			<div className="mt-8 flex flex-col items-center gap-3 py-8 border-t border-neutral-200 dark:border-neutral-800">
				<p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
					Finished reading? Test your understanding!
				</p>
				{error && <p className="text-xs text-red-500">{error}</p>}
				<button
					onClick={generateQuiz}
					className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-violet-200 dark:shadow-violet-950/40 transition-all hover:scale-105 active:scale-100"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Take the Completion Quiz
				</button>
				<p className="text-xs text-neutral-400 dark:text-neutral-500">
					{allPosts.length} articles · 5 AI-generated questions
				</p>
			</div>
		);
	}

	// ── loading ──
	if (state === 'loading') {
		return (
			<div className="mt-8 flex flex-col items-center gap-3 py-10 border-t border-neutral-200 dark:border-neutral-800">
				<svg className="w-8 h-8 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
				</svg>
				<p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
					Generating your personalised quiz…
				</p>
				<p className="text-xs text-neutral-400 dark:text-neutral-500">AI is crafting questions based on what you read</p>
			</div>
		);
	}

	// ── active ──
	if (state === 'active') {
		const answeredCount = answers.filter((a) => a !== undefined).length;
		const progressPct = Math.round((answeredCount / questions.length) * 100);

		return (
			<div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
				{/* Quiz header */}
				<div className="flex items-center justify-between gap-4 mb-6">
					<div>
						<h4 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
							Completion Quiz
						</h4>
						<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
							{answeredCount} of {questions.length} answered
						</p>
					</div>
					{/* Progress pill */}
					<div className="flex items-center gap-2">
						<div className="w-24 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
							<div
								className="h-full rounded-full bg-violet-500 transition-all duration-500"
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">{progressPct}%</span>
					</div>
				</div>

				{/* Questions */}
				<div className="flex flex-col gap-8">
					{questions.map((q, i) => (
						<QuestionBlock
							key={i}
							question={q}
							index={i}
							locked={state !== 'active'}
							onAnswer={(correct) => handleAnswer(i, correct)}
						/>
					))}
				</div>
			</div>
		);
	}

	// ── done ──
	return (
		<div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
			{/* Show all questions read-only */}
			<div className="flex flex-col gap-8">
				{questions.map((q, i) => (
					<QuestionBlock
						key={i}
						question={q}
						index={i}
						locked={true}
						onAnswer={() => {}}
					/>
				))}
			</div>

			{/* Score celebration */}
			<ScorePanel
				score={score}
				total={questions.length}
				topic={topic}
				onRetry={generateQuiz}
				onDismiss={() => setState('idle')}
			/>
		</div>
	);
}
