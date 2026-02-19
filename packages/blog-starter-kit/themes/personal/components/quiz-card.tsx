import { useState } from 'react';

type Question = {
	q: string;
	options: string[];
	answer: number; // 0-based index of correct option
	explanation?: string;
};

type Props = {
	title?: string;
	questions: Question[];
};

const OptionBtn = ({
	label,
	text,
	state,
	revealed,
	onClick,
}: {
	label: string;
	text: string;
	state: 'idle' | 'selected' | 'correct' | 'wrong';
	revealed: boolean;
	onClick: () => void;
}) => {
	const base =
		'w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-all';
	const styles: Record<typeof state, string> = {
		idle: 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-700 dark:text-neutral-300 cursor-pointer',
		selected: 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 cursor-pointer',
		correct: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 cursor-default',
		wrong: 'border-red-300 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 opacity-70 cursor-default',
	};

	return (
		<button
			className={`${base} ${styles[state]}`}
			onClick={!revealed ? onClick : undefined}
			disabled={revealed && state !== 'correct' && state !== 'wrong'}
		>
			<span className="flex-shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold leading-none">
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

const LABELS = ['A', 'B', 'C', 'D', 'E'];

const QuestionBlock = ({ question, index }: { question: Question; index: number }) => {
	const [selected, setSelected] = useState<number | null>(null);
	const revealed = selected !== null;

	const getState = (i: number): 'idle' | 'selected' | 'correct' | 'wrong' => {
		if (!revealed) return i === selected ? 'selected' : 'idle';
		if (i === question.answer) return 'correct';
		if (i === selected) return 'wrong';
		return 'idle';
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
						onClick={() => setSelected(i)}
					/>
				))}
			</div>
			{revealed && question.explanation && (
				<div className="mt-1 px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
					<span className="font-bold text-neutral-700 dark:text-neutral-300">Explanation: </span>
					{question.explanation}
				</div>
			)}
		</div>
	);
};

/**
 * QuizCard — interactive multiple-choice quiz block for article pages.
 *
 * Usage:
 *   <QuizCard
 *     title="Practice Quiz"
 *     questions={[
 *       {
 *         q: "What is the time complexity of binary search?",
 *         options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
 *         answer: 1,
 *         explanation: "Binary search halves the search space each step → O(log n)."
 *       }
 *     ]}
 *   />
 */
export const QuizCard = ({ title = 'Practice Quiz', questions }: Props) => {
	const [allRevealed, setAllRevealed] = useState(false);

	return (
		<div className="my-10 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-blue-600 to-teal-600">
				<div className="flex items-center gap-2.5">
					<svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
					</svg>
					<h3 className="text-white font-bold text-base tracking-tight">{title}</h3>
				</div>
				<span className="text-white/70 text-xs font-mono">
					{questions.length} question{questions.length !== 1 ? 's' : ''}
				</span>
			</div>

			{/* Instructions banner */}
			<div className="px-5 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50">
				<p className="text-xs text-blue-600 dark:text-blue-400">
					Select an option to check your answer immediately.
				</p>
			</div>

			{/* Questions */}
			<div className="px-5 py-6 flex flex-col gap-8 bg-white dark:bg-neutral-950">
				{questions.map((q, i) => (
					<QuestionBlock key={i} question={q} index={i} />
				))}
			</div>

			{/* Footer */}
			<div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between gap-4">
				<p className="text-xs text-neutral-500 dark:text-neutral-400">
					Click any option to reveal the correct answer.
				</p>
				<button
					onClick={() => setAllRevealed((v) => !v)}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
				>
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
					</svg>
					{allRevealed ? 'Hide answers' : 'Reveal all answers'}
				</button>
			</div>
		</div>
	);
};
