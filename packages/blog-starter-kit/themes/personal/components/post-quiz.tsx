import { useState } from 'react';
import type { QuizQuestion } from '../pages/api/quiz';

// ─── Icons ────────────────────────────────────────────────────────────────────

const SparkleIcon = () => (
	<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
		<path d="M12 2l2.09 6.41L20.5 9l-5 4.59L17 21l-5-3.91L7 21l1.5-7.41L3.5 9l6.41-.59L12 2z" />
	</svg>
);

const Spinner = () => (
	<svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
	</svg>
);

const RefreshIcon = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
	</svg>
);

// ─── Option button ────────────────────────────────────────────────────────────

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong';

const LABELS = ['A', 'B', 'C', 'D', 'E'];

const OptionBtn = ({
	label, text, state, revealed, onClick,
}: {
	label: string; text: string; state: OptionState; revealed: boolean; onClick: () => void;
}) => {
	const base = 'w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-all duration-150';
	const styles: Record<OptionState, string> = {
		idle:     'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-700 dark:text-neutral-300 cursor-pointer',
		selected: 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 cursor-pointer',
		correct:  'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 cursor-default',
		wrong:    'border-red-300 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 opacity-70 cursor-default',
	};
	return (
		<button className={`${base} ${styles[state]}`} onClick={!revealed ? onClick : undefined} disabled={revealed && state === 'idle'}>
			<span className="flex-shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold leading-none mt-0.5">
				{label}
			</span>
			<span className="flex-1">{text}</span>
			{state === 'correct' && (
				<svg className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
				</svg>
			)}
			{state === 'wrong' && (
				<svg className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
				</svg>
			)}
		</button>
	);
};

// ─── Single question block ────────────────────────────────────────────────────

const QuestionBlock = ({
	question, index, onAnswer,
}: {
	question: QuizQuestion; index: number; onAnswer: (correct: boolean) => void;
}) => {
	const [selected, setSelected] = useState<number | null>(null);
	const revealed = selected !== null;

	const getState = (i: number): OptionState => {
		if (!revealed) return 'idle';
		if (i === question.answer) return 'correct';
		if (i === selected) return 'wrong';
		return 'idle';
	};

	const handleSelect = (i: number) => {
		if (revealed) return;
		setSelected(i);
		onAnswer(i === question.answer);
	};

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug">
				<span className="text-neutral-400 dark:text-neutral-500 font-mono mr-1.5">Q{index + 1}.</span>
				{question.q}
			</p>
			<div className="flex flex-col gap-2">
				{question.options.map((opt, i) => (
					<OptionBtn
						key={i}
						label={LABELS[i]}
						text={opt}
						state={getState(i)}
						revealed={revealed}
						onClick={() => handleSelect(i)}
					/>
				))}
			</div>
			{revealed && question.explanation && (
				<div className="px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
					<span className="font-bold text-neutral-700 dark:text-neutral-300">Explanation: </span>
					{question.explanation}
				</div>
			)}
		</div>
	);
};

// ─── Score summary bar ────────────────────────────────────────────────────────

const ScoreBar = ({ correct, total }: { correct: number; total: number }) => {
	const pct = Math.round((correct / total) * 100);
	const color =
		pct >= 75 ? 'bg-emerald-500' :
		pct >= 50 ? 'bg-amber-500' :
		'bg-red-500';
	const label =
		pct === 100 ? '🎉 Perfect score!' :
		pct >= 75   ? '✅ Great work!' :
		pct >= 50   ? '📚 Keep studying!' :
		'🔁 Review the article and try again';

	return (
		<div className="mt-6 px-5 py-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-2">
			<div className="flex items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300">
				<span>{label}</span>
				<span className="font-mono tabular-nums">{correct}/{total}</span>
			</div>
			<div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-700 ${color}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
};

// ─── Main export ──────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'ready' | 'error';

type Props = {
	postTitle: string;
	postContent: string;
};

export const PostQuiz = ({ postTitle, postContent }: Props) => {
	const [status, setStatus] = useState<Status>('idle');
	const [questions, setQuestions] = useState<QuizQuestion[]>([]);
	const [errorMsg, setErrorMsg] = useState('');
	const [answers, setAnswers] = useState<boolean[]>([]);

	const generate = async () => {
		setStatus('loading');
		setQuestions([]);
		setAnswers([]);
		setErrorMsg('');
		try {
			const res = await fetch('/api/post-quiz', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postTitle, postContent }),
			});
			const data = await res.json();
			if (!res.ok || 'error' in data) throw new Error(data.error ?? 'Unknown error');
			setQuestions(data.questions);
			setAnswers(new Array(data.questions.length).fill(undefined));
			setStatus('ready');
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
			setStatus('error');
		}
	};

	const handleAnswer = (index: number, correct: boolean) => {
		setAnswers((prev) => {
			const next = [...prev];
			next[index] = correct;
			return next;
		});
	};

	const answeredCount = answers.filter((a) => a !== undefined).length;
	const correctCount = answers.filter(Boolean).length;
	const allAnswered = answeredCount === questions.length && questions.length > 0;

	return (
		<div className="mt-12 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
			{/* ── Header ── */}
			<div className="flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-sky-600 to-blue-600">
				<div className="flex items-center gap-2.5">
					<svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
					</svg>
					<h3 className="text-white font-bold text-base tracking-tight">Test Your Knowledge</h3>
				</div>
				{status === 'ready' && (
					<button
						onClick={generate}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
					>
						<RefreshIcon />
						New quiz
					</button>
				)}
			</div>

			{/* ── Body ── */}
			<div className="bg-white dark:bg-neutral-950">

				{/* Idle: teaser + CTA */}
				{status === 'idle' && (
					<div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
						<span className="text-4xl">🧠</span>
						<div>
							<p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
								Ready to test what you just learned?
							</p>
							<p className="text-xs text-neutral-500 dark:text-neutral-400">
								AI will generate 4 questions based on this article&apos;s content.
							</p>
						</div>
						<button
							onClick={generate}
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
						>
							<SparkleIcon />
							Generate Quiz
						</button>
					</div>
				)}

				{/* Loading */}
				{status === 'loading' && (
					<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
						<Spinner />
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							Crafting your quiz…
						</p>
					</div>
				)}

				{/* Error */}
				{status === 'error' && (
					<div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
						<span className="text-4xl">⚠️</span>
						<p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
						<button
							onClick={generate}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 transition-all"
						>
							<RefreshIcon />
							Try again
						</button>
					</div>
				)}

				{/* Ready: questions */}
				{status === 'ready' && questions.length > 0 && (
					<div className="px-5 py-6 flex flex-col gap-7">
						{questions.map((q, i) => (
							<QuestionBlock
								key={i}
								question={q}
								index={i}
								onAnswer={(correct) => handleAnswer(i, correct)}
							/>
						))}
						{allAnswered && <ScoreBar correct={correctCount} total={questions.length} />}
					</div>
				)}
			</div>

			{/* ── Footer ── */}
			{status === 'ready' && (
				<div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between gap-4">
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						{allAnswered
							? `${correctCount} of ${questions.length} correct`
							: `${answeredCount} of ${questions.length} answered`}
					</p>
					<p className="text-xs text-neutral-400 dark:text-neutral-500">
						AI · answers may vary
					</p>
				</div>
			)}
		</div>
	);
};
